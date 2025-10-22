import { Test } from "@nestjs/testing"
import { ExampleModule } from "./example.module"

describe("ExampleModule", () => {
  it("should compile the module", async () => {
    const module = await Test.createTestingModule({
      imports: [ExampleModule],
    }).compile()

    expect(module).toBeDefined()
    expect(module).toBeInstanceOf(Object)
  })
})
