import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('User not found');
    }
  }

  async findByEmail(emailId: string): Promise<User> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { emailId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('User not found');
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      const existingUser = await this.prisma.user.findUnique({
        where: { emailId: createUserDto.emailId },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          emailId: createUserDto.emailId,
          password: hashedPassword,
          username: createUserDto.username,
        },
      });

      return {
        id: user.id,
        emailId: user.emailId,
        username: user.username,
        createdAt: user.createdAt,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException('Error creating user');
      }
      throw error;
    }
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    try {
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new NotFoundException('User not found');
      }

      const updateData: Prisma.UserUpdateInput = {};

      if (updateUserDto.username) {
        updateData.username = updateUserDto.username;
      }

      if (updateUserDto.password) {
        updateData.password = await bcrypt.hash(updateUserDto.password, 10);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id },
        data: updateData,
      });

      return {
        id: updatedUser.id,
        emailId: updatedUser.emailId,
        username: updatedUser.username,
        createdAt: updatedUser.createdAt,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ConflictException('Error updating user');
      }
      throw error;
    }
  }
}
