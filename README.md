# @neoma/managed-app

A NestJS testing utility that provides managed application instance handling for E2E tests with automatic lifecycle management and singleton pattern support.

[![npm version](https://badge.fury.io/js/@neoma%2Fmanaged-app.svg)](https://www.npmjs.com/package/@neoma/managed-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Description

`@neoma/managed-app` simplifies NestJS E2E testing by providing a convenient utility to create, manage, and reuse application instances across your test suites. It eliminates boilerplate code, ensures proper cleanup, and supports dynamic module loading from configurable paths.

## Features

- **Singleton Pattern**: Automatically manages a single application instance across tests
- **Automatic Lifecycle Management**: Built-in Jest hooks handle app initialization and cleanup
- **Dynamic Module Loading**: Load NestJS modules from configurable file paths via environment variables
- **Type-Safe**: Full TypeScript support with comprehensive type definitions
- **Zero Configuration**: Works out of the box with sensible defaults

## Installation

```bash
npm install --save-dev @neoma/managed-app
```

### Peer Dependencies

This package requires NestJS v11.x or higher:

```bash
npm install @nestjs/common @nestjs/core @nestjs/testing
```

## Quick Start

```typescript
import { INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { managedAppInstance } from "@neoma/managed-app"

describe("My API", () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await managedAppInstance()
  })

  it("should return 200 OK", () => {
    return request(app.getHttpServer())
      .get("/health")
      .expect(200)
  })
})
```

## API Reference

### `managedAppInstance()`

Creates and returns a managed singleton NestJS application instance. The instance is automatically reused across multiple test calls and cleaned up after each test.

```typescript
async function managedAppInstance(): Promise<INestApplication<App>>
```

**Returns**: A Promise that resolves to a NestJS application instance

**Behavior**:
- First call: Creates and initializes the app
- Subsequent calls: Returns the cached instance
- After each test: Automatically closes and cleans up the instance via Jest's `afterEach` hook

**Default Module**: Loads from `src/application/application.module.ts#ApplicationModule`

**Example**:

```typescript
describe("API Tests", () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await managedAppInstance()
  })

  it("should handle requests", () => {
    return request(app.getHttpServer())
      .get("/api/users")
      .expect(200)
  })
})
```

### `nestJsApp(module)`

A basic utility function that creates a NestJS test application instance from a provided module.

**Note**: This function does NOT provide managed features (no singleton pattern, no automatic cleanup). If you need managed lifecycle, use `managedAppInstance()` instead.

```typescript
async function nestJsApp(
  m: Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference
): Promise<INestApplication<App>>
```

**Parameters**:
- `m`: The NestJS module to create the app from

**Returns**: A Promise that resolves to a NestJS application instance

**Example**:

```typescript
const app = await nestJsApp(AppModule)
// Remember to manually close the app when done
await app.close()
```

## Configuration

### Environment Variables

#### `NEOMA_MANAGED_APP_MODULE_PATH`

Specifies the path and export name of the module to load for `managedAppInstance()`.

**Format**: `path/to/module.ts#ExportedModuleName`

**Examples**:

```bash
# Use a custom test module
export NEOMA_MANAGED_APP_MODULE_PATH=src/test/e2e.module.ts#E2ETestModule

# Use environment-specific module
export NEOMA_MANAGED_APP_MODULE_PATH=src/env/test.module.ts#TestModule
```

**Default**: `src/application/application.module.ts#ApplicationModule`

### Module Path Syntax

The module path uses a hash (`#`) to separate the file path from the export name:

```
src/my/module/path.ts#MyModuleName
└─────┬──────────────┘ └─────┬──────┘
   File Path           Export Name
```

- **File Path**: Relative path from project root to the TypeScript module file
- **Export Name**: The named export from that file

## Usage Patterns

### Basic E2E Testing

```typescript
import { INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { managedAppInstance } from "@neoma/managed-app"

describe("Users API", () => {
  let app: INestApplication

  beforeEach(async () => {
    app = await managedAppInstance()
  })

  it("should create a user", () => {
    return request(app.getHttpServer())
      .post("/users")
      .send({ name: "John Doe" })
      .expect(201)
  })

  it("should get all users", () => {
    return request(app.getHttpServer())
      .get("/users")
      .expect(200)
  })
})
```

### Testing Different Environments

```typescript
describe("Staging environment tests", () => {
  beforeAll(() => {
    process.env.NEOMA_MANAGED_APP_MODULE_PATH =
      "src/env/staging.module.ts#StagingModule"
  })

  afterAll(() => {
    delete process.env.NEOMA_MANAGED_APP_MODULE_PATH
  })

  it("should use staging configuration", async () => {
    const app = await managedAppInstance()
    // Test with staging environment config
  })
})
```

### Integration with Database Testing

```typescript
import { managedAppInstance } from "@neoma/managed-app"
import { DataSource } from "typeorm"

describe("Database Integration", () => {
  let app: INestApplication
  let dataSource: DataSource

  beforeEach(async () => {
    app = await managedAppInstance()
    dataSource = app.get(DataSource)
  })

  afterEach(async () => {
    // Clean up database after each test
    await dataSource.synchronize(true)
  })

  it("should save entity to database", async () => {
    // Your database test here
  })
})
```

### Accessing Services in Tests

```typescript
import { managedAppInstance } from "@neoma/managed-app"
import { UserService } from "../src/users/user.service"

describe("User Service", () => {
  let app: INestApplication
  let userService: UserService

  beforeEach(async () => {
    app = await managedAppInstance()
    userService = app.get(UserService)
  })

  it("should find user by id", async () => {
    const user = await userService.findById(1)
    expect(user).toBeDefined()
  })
})
```

## How It Works

### Automatic Lifecycle Management

The module automatically registers a Jest `afterEach` hook at import time:

```typescript
let appInstance: INestApplication | null = null

afterEach(async () => {
  if (appInstance) {
    await appInstance.close()
    appInstance = null
  }
})
```

This ensures:
- No resource leaks between tests
- Clean slate for each test
- Proper shutdown of HTTP servers, database connections, etc.

### Singleton Pattern

`managedAppInstance()` implements a singleton pattern that:
1. Creates the app on first call and caches it
2. Returns the cached instance on subsequent calls
3. Resets after each test via the `afterEach` hook

This reduces test overhead while maintaining isolation between test cases.

## Error Handling

The module provides clear error messages for common issues:

### Module Not Found

```
Error: Module not found: /path/to/src/missing/module.ts
```

**Solution**: Verify the file path in `NEOMA_MANAGED_APP_MODULE_PATH` exists

### Export Not Found

```
Error: Module found but no export named WrongName: /path/to/src/app/app.module.ts
```

**Solution**: Ensure the export name after `#` matches the actual export in the file

## Testing

Run the test suite:

```bash
npm run test:e2e
```

Run with watch mode:

```bash
npm run test:e2e -- --watch
```

## Requirements

- Node.js >= 22.0.0
- NestJS >= 11.0.0
- TypeScript >= 5.0.0
- Jest (for test lifecycle hooks)

## Roadmap

Potential future enhancements:

- Support passing a module directly to `managedAppInstance(module)` for inline customization
- Support for custom initialization logic hooks
- Optional test isolation modes

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please file an issue on [GitHub](https://github.com/shipdventures/neoma-managed-app/issues).

## Related Packages

- [@neoma/route-model-binding](https://www.npmjs.com/package/@neoma/route-model-binding) - NestJS route model binding utilities
