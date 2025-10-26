import { HttpStatus } from "@nestjs/common"
import * as request from "supertest"
import { managedAppInstance } from "@neoma/managed-app"
import { copyFileSync, rmSync } from "fs"
import { resolve } from "path"

const SRC = "src/env/bak.env.module.ts"
const LOCATION = "src/env/env.module.ts"
const MODULE = "EnvironmentModule"
const INCORRECT_EXPORT = "EnvModule"

describe(LOCATION, () => {
  describe(`Given there is a module at ${LOCATION} with the export ${MODULE}`, () => {
    beforeEach(async () => {
      copyFileSync(SRC, LOCATION)
    })

    afterEach(() => {
      rmSync(LOCATION)
      delete process.env.NEOMA_MANAGED_APP_MODULE_PATH
    })

    describe(`And process.env.NEOMA_MANAGED_APP_MODULE_PATH is set to ${LOCATION}#${MODULE}`, () => {
      beforeEach(async () => {
        process.env.NEOMA_MANAGED_APP_MODULE_PATH = `${LOCATION}#${MODULE}`
      })

      it("it should automatically load the module.", async () => {
        return request((await managedAppInstance()).getHttpServer())
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
          `Module found but no export named ${INCORRECT_EXPORT}: ${resolve(LOCATION)}`,
        )
      })
    })
  })

  describe(`When there is not a module at ${LOCATION}`, () => {
    beforeEach(async () => {
      process.env.NEOMA_MANAGED_APP_MODULE_PATH = `${LOCATION}#${MODULE}`
    })

    it("it should throw an error.", async () => {
      return expect(managedAppInstance()).rejects.toThrow(
        `Module not found: ${resolve(LOCATION)}`,
      )
    })
  })
})
