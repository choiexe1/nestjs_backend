import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { User } from "../users/entities/user.entity";
import { UserRepository } from "../core/repositories/user.repository.interface";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
  ) {}

  async register(registerDto: RegisterDto): Promise<Omit<User, "password">> {
    const { email, password, ...userData } = registerDto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException("이미 존재하는 이메일입니다.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.userRepository.create({
      ...userData,
      email,
      password: hashedPassword,
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(loginDto: LoginDto): Promise<Omit<User, "password">> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 일치하지 않습니다.",
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        "이메일 또는 비밀번호가 일치하지 않습니다.",
      );
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, "password"> | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
