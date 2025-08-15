import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { UserInitializeService } from "./users.initialize.service";
import { User } from "./entities/user.entity";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule)
  ],
  controllers: [UsersController],
  providers: [UsersService, UserInitializeService],
  exports: [UsersService, UserInitializeService],
})
export class UsersModule {}
