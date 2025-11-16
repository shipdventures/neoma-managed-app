/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process")
const { existsSync, rmSync } = require("fs")

const LOCATION = "src/application/application.module.ts"

beforeAll(() => {
  console.log("Building library for E2E tests...")
  execSync("npm run build", { stdio: "inherit" })
})

afterEach(() => {
  if (existsSync(LOCATION)) {
    rmSync(LOCATION)
  }
  delete process.env.NEOMA_MANAGED_APP_MODULE_PATH
  jest.resetModules()
})
