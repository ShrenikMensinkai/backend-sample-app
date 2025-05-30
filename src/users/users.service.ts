import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(emailId: string) {
    try {
      return await this.prisma.user.findUnique({
        where: { emailId },
      });
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user already exists
    let existingUser;
    try {
      existingUser = await this.prisma.user.findUnique({
        where: { emailId: createUserDto.emailId },
      });
    } catch (error) {
      throw new ConflictException('Error checking for existing user');
    }

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Create the user
    const user = await this.prisma.user.create({
      data: {
        emailId: createUserDto.emailId,
        password: hashedPassword,
        username: createUserDto.username,
      },
    });

    // Return user data without password
    return {
      id: user.id,
      emailId: user.emailId,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}
