import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  CommentDetailResponseDto,
  CommentListResponseDto,
} from './dto/comment-response.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
import { PrismaClient } from '@prisma/client';

type CommentWithAuthor = {
  id: number;
  content: string;
  createdAt: Date;
  author: {
    username: string;
  };
  postId: number;
  post: {
    authorId: number;
  };
};

@Injectable()
export class CommentsService {
  private readonly COMMENTS_PER_PAGE = 10;
  private readonly prisma: PrismaClient;

  constructor(prismaService: PrismaService) {
    this.prisma = prismaService;
  }

  async create(
    postId: number,
    authorId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentDetailResponseDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const comment = (await this.prisma.comment.create({
      data: {
        ...createCommentDto,
        authorId,
        postId,
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        post: {
          select: {
            authorId: true,
          },
        },
      },
    })) as CommentWithAuthor;

    return this.mapToCommentDetailResponse(comment);
  }

  async findAll(
    postId: number,
    paginationQuery: CursorPaginationDto,
  ): Promise<CommentListResponseDto> {
    const { cursor } = paginationQuery;

    const comments = await this.prisma.comment.findMany({
      take: this.COMMENTS_PER_PAGE + 1, // Take one extra to check if there are more
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1, // Skip the cursor
      }),
      where: {
        postId,
      },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        post: {
          select: {
            authorId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const hasMore = comments.length > this.COMMENTS_PER_PAGE;
    const commentsToReturn = hasMore
      ? comments.slice(0, this.COMMENTS_PER_PAGE)
      : comments;

    return {
      comments: commentsToReturn.map(this.mapToCommentListItem),
      nextCursor: hasMore
        ? commentsToReturn[commentsToReturn.length - 1].id
        : null,
    };
  }

  async delete(id: number, userId: number): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        post: {
          select: {
            authorId: true,
          },
        },
      },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Check if user is the comment author or post author
    if (comment.authorId !== userId && comment.post.authorId !== userId) {
      throw new ForbiddenException(
        'Only the comment author or post author can delete this comment',
      );
    }

    await this.prisma.comment.delete({
      where: { id },
    });
  }

  private readonly mapToCommentListItem = (comment: CommentWithAuthor) => ({
    id: comment.id,
    content: comment.content,
    author: {
      username: comment.author.username,
    },
    createdAt: comment.createdAt.toISOString(),
  });

  private readonly mapToCommentDetailResponse = (
    comment: CommentWithAuthor,
  ): CommentDetailResponseDto => ({
    ...this.mapToCommentListItem(comment),
    postId: comment.postId,
  });
}
