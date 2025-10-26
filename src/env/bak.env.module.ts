import { Module } from "@nestjs/common"
import {
  CONTROLLER_MESSAGE,
  MessageController,
} from "src/controllers/message.controller"

@Module({
  controllers: [MessageController],
  providers: [
    {
      provide: CONTROLLER_MESSAGE,
      useValue: "Hello from src/env/env.module.ts#EnvironmentModule",
    },
  ],
})
export class EnvironmentModule {}
