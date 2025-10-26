import {
  DynamicModule,
  ForwardReference,
  INestApplication,
  Type,
} from "@nestjs/common"
import { Test } from "@nestjs/testing"
import { App } from "supertest/types"
import { resolve } from "path"

/**
 * Loads the default application module based on environment variable
 * or default paths.
 *
 * The module path is determined by the environment variable
 * NEOMA_MANAGED_APP_MODULE_PATH which should be in the format
 * path/to/module-file.ts#ExportedModuleName
 *
 * If the environment variable is not set, the following default path is used:
 * src/application/application.module.ts#ApplicationModule
 *
 * @returns A Promise that resolves to the module class.
 */
const getDefaultModule = async (): Promise<Type<any>> => {
  const modulePath =
    process.env.NEOMA_MANAGED_APP_MODULE_PATH ||
    "src/application/application.module.ts#ApplicationModule"

  const moduleParts = modulePath.split("#")
  const fullPath = resolve(...moduleParts.slice(0, -1))
  const exportName = moduleParts[moduleParts.length - 1]

  let moduleImport: any
  try {
    moduleImport = await import(fullPath)
  } catch {
    throw new Error(`Module not found: ${fullPath}`)
  }

  const ModuleClass = moduleImport[exportName]

  if (ModuleClass) {
    return ModuleClass
  }

  throw new Error(`Module found but no export named ${exportName}: ${fullPath}`)
}

/**
 * Creates a NestJS test application instance that loads the AppModule.
 *
 * @prop m The module to load into the test application.
 *
 * @returns A {@link INestApplication} instance for e2e testing.
 */
export const nestJsApp = async (
  m: Type<any> | DynamicModule | Promise<DynamicModule> | ForwardReference,
): Promise<INestApplication<App>> => {
  const moduleFixture = await Test.createTestingModule({
    imports: [m],
  }).compile()

  return moduleFixture.createNestApplication({
    bufferLogs: true,
  })
}

let appInstance: INestApplication<App> | null = null
afterEach(async () => {
  if (appInstance) {
    await appInstance.close()
    appInstance = null
  }
})

/**
 * Provides a managed and initialised NestJS application instance for testing.
 *
 * This function ensures that only one instance of the application is created
 * and reused across multiple calls. It loads the default module as specified
 * by the environment variable or default path.
 *
 * The module that is loaded can be specified using the environment variable
 * `NEOMA_MANAGED_APP_MODULE_PATH` in the format:
 * `path/to/module-file.ts#ExportedModuleName`
 *
 * If the environment variable is not set, it defaults to:
 * `src/application/application.module.ts#ApplicationModule`
 *
 * @example
 * ```typescript
 * import { INestApplication } from "@nestjs/common"
 * import { managedAppInstance } from "@neoma/managed-app"
 *
 * let app: INestApplication
 * beforeEach(async () => {
 *   app = await managedAppInstance()
 * })
 *
 * @returns A Promise that resolves to the managed {@link INestApplication} instance.
 */
export const managedAppInstance = async (): Promise<INestApplication<App>> => {
  if (!appInstance) {
    appInstance = await nestJsApp(await getDefaultModule())
    return appInstance.init()
  }
  return appInstance
}
