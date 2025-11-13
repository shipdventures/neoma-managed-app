import { HttpStatus } from "@nestjs/common"
import * as request from "supertest"
import { managedAppInstance } from "@lib"
import { copyFileSync, existsSync, rmSync } from "fs"
import { resolve } from "path"

const SRC = "src/env/bak.env.module.ts"
const LOCATION = "src/env/env.module.ts"
const MODULE = "EnvironmentModule"
const INCORRECT_EXPORT = "EnvModule"
const ERROR_SRC = "src/env/bak.error.module.ts"
const ERROR_MODULE = "ErrorModule"

describe(LOCATION, () => {
  beforeEach(() => {
    if (existsSync(LOCATION)) {
      rmSync(LOCATION)
    }
    delete process.env.NEOMA_MANAGED_APP_MODULE_PATH
    jest.resetModules()
  })

  describe(`Given there is a module at ${LOCATION} with the export ${MODULE}`, () => {
    beforeEach(async () => {
      copyFileSync(SRC, LOCATION)
    })

    describe(`And process.env.NEOMA_MANAGED_APP_MODULE_PATH is set to ${LOCATION}#${MODULE}`, () => {
      beforeEach(async () => {
        process.env.NEOMA_MANAGED_APP_MODULE_PATH = `${LOCATION}#${MODULE}`
      })

      it("it should automatically load the module.", async () => {
        const app = await managedAppInstance()
        return request(app.getHttpServer())
          .get("/message")
          .expect(HttpStatus.OK)
          .expect({ message: `Hello from ${LOCATION}#${MODULE}` })
      })

      it("it should return the same instance upon successive calls", async () => {
        expect(await managedAppInstance()).toBe(await managedAppInstance())
      })
    })

    describe(`But process.env.NEOMA_MANAGED_APP_MODULE_PATH is set to ${LOCATION}#${INCORRECT_EXPORT}`, () => {
      beforeEach(async () => {
        process.env.NEOMA_MANAGED_APP_MODULE_PATH = `${LOCATION}#${INCORRECT_EXPORT}`
      })

      it("it should throw an error", () => {
        return expect(managedAppInstance()).rejects.toThrow(
          `${resolve(LOCATION)} module found but is missing an export named ${INCORRECT_EXPORT}. Please ensure a module exists at src/application/appliction.module.ts with the named import ApplicationModule or that process.env.NEOMA_MANAGED_APP_MODULE_PATH is set correctly.`,
        )
      })
    })
  })

  describe(`Given there is a module at ${LOCATION} with the import ${ERROR_MODULE}`, () => {
    describe(`And process.env.NEOMA_MANAGED_APP_MODULE_PATH is set to ${LOCATION}#${ERROR_MODULE}`, () => {
      describe("But the module throws an error when being loaded", () => {
        beforeEach(async () => {
          copyFileSync(ERROR_SRC, LOCATION)
          process.env.NEOMA_MANAGED_APP_MODULE_PATH = `${LOCATION}#${ERROR_MODULE}`
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
    beforeEach(async () => {
      process.env.NEOMA_MANAGED_APP_MODULE_PATH = `${LOCATION}#${MODULE}`
    })

    it("it should throw an error.", async () => {
      return expect(managedAppInstance()).rejects.toThrow(
        `${resolve(LOCATION)} module not found. Please ensure a module exists at src/application/appliction.module.ts with the named import ApplicationModule or that process.env.NEOMA_MANAGED_APP_MODULE_PATH is set correctly.`,
      )
    })
  })
})
