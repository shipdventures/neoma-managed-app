import { HttpStatus, INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { App } from "supertest/types"
import { managedAppInstance } from "@neoma/managed-app"
import { copyFileSync, rmSync } from "fs"
import { resolve } from "path"

const SRC = "src/application/bak.application.module.ts"
const INCORRECT_EXPORT_SRC = "src/application/bak.application#app.module.ts"
const LOCATION = "src/application/application.module.ts"
const MODULE = "ApplicationModule"

describe(LOCATION, () => {
  describe(`When there is a module at ${LOCATION} with the export ${MODULE}`, () => {
    let app: INestApplication<App>
    beforeEach(async () => {
      copyFileSync(SRC, LOCATION)
      app = await managedAppInstance()
    })

    afterEach(() => {
      rmSync(LOCATION)
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

    afterEach(() => {
      rmSync(LOCATION)
    })

    it("it should throw an error.", async () => {
      return expect(managedAppInstance()).rejects.toThrow(
        `Module found but no export named ApplicationModule: ${resolve(LOCATION)}`,
      )
    })
  })

  describe(`When there is not a module at ${LOCATION}`, () => {
    it("it should throw an error.", async () => {
      return expect(managedAppInstance()).rejects.toThrow(
        `Module not found: ${resolve(LOCATION)}`,
      )
    })
  })
})
