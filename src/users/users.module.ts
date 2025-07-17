import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { InMemoryUserRepository } from "./in-memory-user.repository";

@Module({
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: "UserRepository",
      useClass: InMemoryUserRepository,
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
