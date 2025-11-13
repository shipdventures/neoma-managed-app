import { HttpStatus, INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { App } from "supertest/types"
import { managedAppInstance } from "@lib"
import { copyFileSync, existsSync, rmSync } from "fs"
import { resolve } from "path"

const SRC = "src/application/bak.application.module.ts"
const INCORRECT_EXPORT_SRC = "src/application/bak.application#app.module.ts"
const LOCATION = "src/application/application.module.ts"
const MODULE = "ApplicationModule"
const ERROR_SRC = "src/application/bak.error.module.ts"
const ERROR_MODULE = "ErrorModule"

describe(LOCATION, () => {
  beforeEach(() => {
    if (existsSync(LOCATION)) {
      rmSync(LOCATION)
    }
    delete process.env.NEOMA_MANAGED_APP_MODULE_PATH
    jest.resetModules()
  })

  describe(`When there is a module at ${LOCATION} with the export ${MODULE}`, () => {
    let app: INestApplication<App>
    beforeEach(async () => {
      copyFileSync(SRC, LOCATION)
      app = await managedAppInstance()
    })

    it("it should automatically load the module.", () => {
      return request(app.getHttpServer())
        .get("/message")
        .expect(HttpStatus.OK)
        .expect({ message: `Hello from ${LOCATION}#${MODULE}` })
    })

    it("it should return the same instance upon successive calls", async () => {
      const app2 = await managedAppInstance()
      expect(app).toBe(app2)
    })
  })

  describe(`When there is a module at ${LOCATION} but the export is not called ${MODULE}`, () => {
    beforeEach(async () => {
      copyFileSync(INCORRECT_EXPORT_SRC, LOCATION)
    })

    it("it should throw an error.", async () => {
      return expect(managedAppInstance()).rejects.toThrow(
        `${resolve(LOCATION)} module found but is missing an export named ${MODULE}. Please ensure a module exists at src/application/appliction.module.ts with the named import ApplicationModule or that process.env.NEOMA_MANAGED_APP_MODULE_PATH is set correctly.`,
      )
    })
  })

  describe(`Given there is a module at ${LOCATION} with the import ${ERROR_MODULE}`, () => {
    describe(`And process.env.NEOMA_MANAGED_APP_MODULE_PATH is set to ${LOCATION}#${ERROR_MODULE}`, () => {
      describe("But the module throws an error when being loaded", () => {
        beforeEach(async () => {
          copyFileSync(ERROR_SRC, LOCATION)
        })

        it("it should throw an error", () => {
          return expect(managedAppInstance()).rejects.toThrow(
            "Module found but an error occured whilst importing. Error: This is a deliberate error in the module",
          )
        })
      })
    })
  })

  describe(`When there is not a module at ${LOCATION}`, () => {
    it("it should throw an error.", async () => {
      return expect(managedAppInstance()).rejects.toThrow(
        `${resolve(LOCATION)} module not found. Please ensure a module exists at src/application/appliction.module.ts with the named import ApplicationModule or that process.env.NEOMA_MANAGED_APP_MODULE_PATH is set correctly.`,
      )
    })
  })
})
