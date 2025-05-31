import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';

describe('CommentsService', () => {
  let service: CommentsService;

  const mockPrismaService = {
    comment: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
    post: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createCommentDto: CreateCommentDto = {
      content: 'Test Comment',
    };
    const postId = 1;
    const authorId = 1;

    it('should successfully create a comment', async () => {
      const mockPost = {
        id: postId,
        authorId: 2,
      };

      const mockComment = {
        id: 1,
        content: createCommentDto.content,
        postId,
        authorId,
        createdAt: new Date(),
        author: {
          username: '홍길동',
        },
        post: {
          authorId: mockPost.authorId,
        },
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);
      mockPrismaService.comment.create.mockResolvedValue(mockComment);

      const result = await service.create(postId, authorId, createCommentDto);

      expect(result).toEqual({
        id: mockComment.id,
        content: mockComment.content,
        author: {
          username: mockComment.author.username,
        },
        createdAt: mockComment.createdAt.toISOString(),
        postId: mockComment.postId,
      });
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: postId },
      });
      expect(mockPrismaService.comment.create).toHaveBeenCalledWith({
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
      });
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(
        service.create(postId, authorId, createCommentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    const postId = 1;
    const mockComments = [
      {
        id: 1,
        content: 'Test Comment',
        postId,
        authorId: 1,
        createdAt: new Date(),
        author: {
          username: '홍길동',
        },
        post: {
          authorId: 2,
        },
      },
      {
        id: 2,
        content: 'Another Comment',
        postId,
        authorId: 2,
        createdAt: new Date(),
        author: {
          username: '김철수',
        },
        post: {
          authorId: 2,
        },
      },
    ];

    it('should return paginated comments without cursor', async () => {
      mockPrismaService.comment.findMany.mockResolvedValue(mockComments);

      const result = await service.findAll(postId, {});

      expect(result).toEqual({
        comments: mockComments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          author: {
            username: comment.author.username,
          },
          createdAt: comment.createdAt.toISOString(),
        })),
        nextCursor: null,
      });
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        take: 11,
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
    });

    it('should return paginated comments with cursor', async () => {
      const paginationQuery: CursorPaginationDto = { cursor: 1 };
      const commentsWithExtra = [
        ...mockComments,
        {
          id: 3,
          content: 'Extra Comment',
          postId,
          authorId: 3,
          createdAt: new Date(),
          author: {
            username: '이영희',
          },
          post: {
            authorId: 2,
          },
        },
      ];

      mockPrismaService.comment.findMany.mockResolvedValue(commentsWithExtra);

      const result = await service.findAll(postId, paginationQuery);

      expect(result).toEqual({
        comments: commentsWithExtra.map((comment) => ({
          id: comment.id,
          content: comment.content,
          author: {
            username: comment.author.username,
          },
          createdAt: comment.createdAt.toISOString(),
        })),
        nextCursor: null,
      });
      expect(mockPrismaService.comment.findMany).toHaveBeenCalledWith({
        take: 11,
        cursor: {
          id: paginationQuery.cursor,
        },
        skip: 1,
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
    });
  });

  describe('delete', () => {
    const commentId = 1;
    const userId = 1;

    it('should successfully delete a comment when user is the author', async () => {
      const mockComment = {
        id: commentId,
        authorId: userId,
        post: {
          authorId: 2,
        },
      };

      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.delete.mockResolvedValue(mockComment);

      await service.delete(commentId, userId);

      expect(mockPrismaService.comment.delete).toHaveBeenCalledWith({
        where: { id: commentId },
      });
    });

    it('should successfully delete a comment when user is the post author', async () => {
      const mockComment = {
        id: commentId,
        authorId: 2,
        post: {
          authorId: userId,
        },
      };

      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);
      mockPrismaService.comment.delete.mockResolvedValue(mockComment);

      await service.delete(commentId, userId);

      expect(mockPrismaService.comment.delete).toHaveBeenCalledWith({
        where: { id: commentId },
      });
    });

    it('should throw NotFoundException if comment not found', async () => {
      mockPrismaService.comment.findUnique.mockResolvedValue(null);

      await expect(service.delete(commentId, userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is neither comment author nor post author', async () => {
      const mockComment = {
        id: commentId,
        authorId: 2,
        post: {
          authorId: 3,
        },
      };

      mockPrismaService.comment.findUnique.mockResolvedValue(mockComment);

      await expect(service.delete(commentId, userId)).rejects.toThrow(ForbiddenException);
    });
  });
}); 