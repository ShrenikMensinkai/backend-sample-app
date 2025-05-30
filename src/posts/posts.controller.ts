import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDetailResponseDto } from './dto/post-detail-response.dto';
import { PostListResponseDto } from './dto/post-list-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: number;
    emailId: string;
  };
}

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Request() req: RequestWithUser,
    @Body() createPostDto: CreatePostDto,
  ): Promise<PostDetailResponseDto> {
    return this.postsService.create(req.user.id, createPostDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PostListResponseDto> {
    return this.postsService.findAll(paginationQuery);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PostDetailResponseDto> {
    return this.postsService.findOne(id);
  }
}
