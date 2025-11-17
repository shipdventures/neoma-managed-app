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
const loadAppModule = async (
  modulePath = "src/application/application.module.ts#ApplicationModule",
): Promise<{
  module: Type<any>
  path: string
}> => {
  const [path, exportName] = modulePath.split("#")
  const fullPath = resolve(path)

  let moduleImport: any
  try {
    moduleImport = await import(fullPath)
  } catch (e) {
    if (e.code === "MODULE_NOT_FOUND" || e.code === "ENOENT") {
      throw new Error(
        `${modulePath} module not found. Please ensure a module exists at ${fullPath} with the named import ${exportName}.`,
      )
    }
    throw new Error(
      `${path} module found but an error occured whilst importing. Error: ${e.message}`,
    )
  }

  const ModuleClass = moduleImport[exportName]

  if (ModuleClass) {
    return { module: ModuleClass, path: fullPath }
  }

  throw new Error(
    `${path} module found but it is missing an export named ${exportName}. Please ensure a module exists at ${fullPath} with the named import ${exportName}.`,
  )
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

const appInstances: Record<string, INestApplication<App>> = {}
afterEach(async () => {
  for (const appInstanceKey in appInstances) {
    const instance = appInstances[appInstanceKey]
    await instance.close()
    delete appInstances[appInstanceKey]
  }
})

/**
 * Provides a managed and initialised NestJS application instance for testing.
 *
 * This function supports multiple isolated application instances based on different
 * module paths. Each unique module path gets its own cached instance that is reused
 * across multiple calls with the same path.
 *
 * Module path can be specified in three ways (in order of precedence):
 * 1. Direct parameter: `managedAppInstance("path/to/module.ts#ExportName")`
 * 2. Environment variable: `NEOMA_MANAGED_APP_MODULE_PATH=path/to/module.ts#ExportName`
 * 3. Default path: `src/application/application.module.ts#ApplicationModule`
 *
 * @param moduleDescriptor - Optional module path in format `path/to/module.ts#ExportedModuleName`.
 *                          Takes precedence over environment variable and default path.
 *
 * @example
 * ```typescript
 * // Using default module
 * const app = await managedAppInstance()
 *
 * // Using environment variable
 * process.env.NEOMA_MANAGED_APP_MODULE_PATH = "src/custom/module.ts#CustomModule"
 * const app = await managedAppInstance()
 *
 * // Using direct parameter (overrides env var)
 * const app = await managedAppInstance("src/other/module.ts#OtherModule")
 *
 * // Multiple apps with different configurations
 * const defaultApp = await managedAppInstance()
 * const customApp = await managedAppInstance("src/custom/module.ts#CustomModule")
 * // defaultApp !== customApp (different instances)
 * ```
 *
 * @returns A Promise that resolves to the managed {@link INestApplication} instance.
 */
export const managedAppInstance = async (
  moduleDescriptor?: string,
): Promise<INestApplication<App>> => {
  const path =
    moduleDescriptor ||
    process.env.NEOMA_MANAGED_APP_MODULE_PATH ||
    "src/application/application.module.ts#ApplicationModule"

  let appInstance = appInstances[path]
  if (!appInstance) {
    const appDetails = await loadAppModule(path)
    appInstance = await nestJsApp(appDetails.module)
    appInstances[path] = appInstance
    return appInstance.init()
  }
  return appInstance
}
