import { Module, forwardRef } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { InMemoryUserRepository } from "./in-memory-user.repository";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: "UserRepository",
      useClass: InMemoryUserRepository,
    },
  ],
  exports: [UsersService, "UserRepository"],
})
export class UsersModule {}
