import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { InMemoryUserRepository } from "../users/in-memory-user.repository";

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: "UserRepository",
      useClass: InMemoryUserRepository,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
