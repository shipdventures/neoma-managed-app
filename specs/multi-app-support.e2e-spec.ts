import { managedAppInstance } from "@lib"
import { HttpStatus } from "@nestjs/common"
import { copyFileSync } from "fs"
import * as request from "supertest"

const SRC = "src/application/bak.application.module.ts"
const DEFAULT_LOCATION = "src/application/application.module.ts"
const DEFAULT_MODULE = "ApplicationModule"
const ENV_LOCATION = "src/env/env.module.ts"
const ENV_MODULE = "EnvModule"
const ENVIRONMENT_LOCATION = "src/env/environment.module.ts"
const ENVIRONMENT_MODULE = "EnvironmentModule"
const PARAMETER = `${ENV_LOCATION}#${ENV_MODULE}`

describe("Multi-app support", () => {
  it("should load multiple apps depending on configuration", async () => {
    copyFileSync(SRC, DEFAULT_LOCATION)
    await request((await managedAppInstance()).getHttpServer())
      .get("/message")
      .expect(HttpStatus.OK)
      .expect({ message: `Hello from ${DEFAULT_LOCATION}#${DEFAULT_MODULE}` })

    process.env.NEOMA_MANAGED_APP_MODULE_PATH = `${ENV_LOCATION}#${ENV_MODULE}`
    await request((await managedAppInstance()).getHttpServer())
      .get("/message")
      .expect(HttpStatus.OK)
      .expect({
        message: `Hello from ${ENV_LOCATION}#${ENV_MODULE}`,
      })

    process.env.NEOMA_MANAGED_APP_MODULE_PATH = `${ENVIRONMENT_LOCATION}#${ENVIRONMENT_MODULE}`
    await request((await managedAppInstance()).getHttpServer())
      .get("/message")
      .expect(HttpStatus.OK)
      .expect({
        message: `Hello from ${ENVIRONMENT_LOCATION}#${ENVIRONMENT_MODULE}`,
      })

    await request((await managedAppInstance(PARAMETER)).getHttpServer())
      .get("/message")
      .expect(HttpStatus.OK)
      .expect({ message: `Hello from ${PARAMETER}` })
  })
})
