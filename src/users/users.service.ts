import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number) {
    try {
      return await this.prisma.user.findUnique({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

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

  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Prepare update data
    const updateData: any = {};

    if (updateUserDto.username) {
      updateData.username = updateUserDto.username;
    }

    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Return user data without password
    return {
      id: updatedUser.id,
      emailId: updatedUser.emailId,
      username: updatedUser.username,
      createdAt: updatedUser.createdAt,
    };
  }
}
