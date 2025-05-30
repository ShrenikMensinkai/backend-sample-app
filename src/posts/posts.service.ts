import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDetailResponseDto } from './dto/post-detail-response.dto';
import {
  PostListResponseDto,
  PostListItemDto,
} from './dto/post-list-response.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Post, PrismaClient } from '@prisma/client';

type PostWithAuthor = Post & {
  author: {
    username: string;
  };
};

@Injectable()
export class PostsService {
  private readonly POSTS_PER_PAGE = 20;
  private readonly prisma: PrismaClient;

  constructor(prismaService: PrismaService) {
    this.prisma = prismaService;
  }

  async create(
    authorId: number,
    createPostDto: CreatePostDto,
  ): Promise<PostDetailResponseDto> {
    const post = (await this.prisma.post.create({
      data: {
        ...createPostDto,
        authorId,
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    })) as PostWithAuthor;

    return this.mapToPostDetailResponse(post);
  }

  async findAll(
    paginationQuery: PaginationQueryDto,
  ): Promise<PostListResponseDto> {
    const { page = 1 } = paginationQuery;
    const skip = (page - 1) * this.POSTS_PER_PAGE;

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        skip,
        take: this.POSTS_PER_PAGE,
        include: {
          author: {
            select: {
              username: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }) as Promise<PostWithAuthor[]>,
      this.prisma.post.count(),
    ]);

    const totalPages = Math.ceil(total / this.POSTS_PER_PAGE);

    return {
      posts: posts.map((post) => this.mapToPostListItem(post)),
      total,
      page,
      totalPages,
    };
  }

  async findOne(id: number): Promise<PostDetailResponseDto> {
    const post = (await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            username: true,
          },
        },
      },
    })) as PostWithAuthor | null;

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    return this.mapToPostDetailResponse(post);
  }

  private readonly mapToPostListItem = (
    post: PostWithAuthor,
  ): PostListItemDto => {
    return {
      id: post.id,
      title: post.title,
      author: {
        username: post.author.username,
      },
      createdAt: post.createdAt.toISOString(),
    };
  };

  private readonly mapToPostDetailResponse = (
    post: PostWithAuthor,
  ): PostDetailResponseDto => {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      author: {
        username: post.author.username,
      },
      createdAt: post.createdAt.toISOString(),
    };
  };
}
