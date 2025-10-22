import { HttpStatus } from "@nestjs/common"
import { managedAppInstance } from "fixtures/app"
import * as request from "supertest"

describe("AppController (e2e)", () => {
  it(`/status (GET) - responds with a HTTP ${HttpStatus.NO_CONTENT}`, () => {
    const app = managedAppInstance()
    return request(app.getHttpServer())
      .get("/status")
      .expect(HttpStatus.NO_CONTENT)
  })
})
