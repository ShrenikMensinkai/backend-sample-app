import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from './posts.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

describe('PostsService', () => {
  let service: PostsService;

  const mockPrismaService = {
    post: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createPostDto: CreatePostDto = {
      title: 'Test Post',
      content: 'Test Content',
    };
    const authorId = 1;

    it('should successfully create a post', async () => {
      const mockPost = {
        id: 1,
        ...createPostDto,
        authorId,
        createdAt: new Date(),
        author: {
          username: '홍길동',
        },
      };

      mockPrismaService.post.create.mockResolvedValue(mockPost);

      const result = await service.create(authorId, createPostDto);

      expect(result).toEqual({
        id: mockPost.id,
        title: mockPost.title,
        content: mockPost.content,
        author: {
          username: mockPost.author.username,
        },
        createdAt: mockPost.createdAt.toISOString(),
      });
      expect(mockPrismaService.post.create).toHaveBeenCalledWith({
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
      });
    });
  });

  describe('findAll', () => {
    const mockPosts = [
      {
        id: 1,
        title: 'Test Post',
        content: 'Test Content',
        author: {
          username: '홍길동',
        },
        createdAt: new Date(),
      },
    ];

    it('should return paginated posts', async () => {
      const paginationQuery: PaginationQueryDto = { page: 1 };
      const total = 1;

      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);
      mockPrismaService.post.count.mockResolvedValue(total);

      const result = await service.findAll(paginationQuery);

      expect(result).toEqual({
        posts: [{
          id: mockPosts[0].id,
          title: mockPosts[0].title,
          author: {
            username: mockPosts[0].author.username,
          },
          createdAt: mockPosts[0].createdAt.toISOString(),
        }],
        total,
        page: 1,
        totalPages: 1,
      });
      expect(mockPrismaService.post.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
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
      });
    });

    it('should handle empty results', async () => {
      mockPrismaService.post.findMany.mockResolvedValue([]);
      mockPrismaService.post.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1 });

      expect(result).toEqual({
        posts: [],
        total: 0,
        page: 1,
        totalPages: 0,
      });
    });
  });

  describe('findOne', () => {
    const postId = 1;

    it('should return a post by id', async () => {
      const mockPost = {
        id: postId,
        title: 'Test Post',
        content: 'Test Content',
        author: {
          username: '홍길동',
        },
        createdAt: new Date(),
      };

      mockPrismaService.post.findUnique.mockResolvedValue(mockPost);

      const result = await service.findOne(postId);

      expect(result).toEqual({
        id: mockPost.id,
        title: mockPost.title,
        content: mockPost.content,
        author: {
          username: mockPost.author.username,
        },
        createdAt: mockPost.createdAt.toISOString(),
      });
      expect(mockPrismaService.post.findUnique).toHaveBeenCalledWith({
        where: { id: postId },
        include: {
          author: {
            select: {
              username: true,
            },
          },
        },
      });
    });

    it('should throw NotFoundException if post not found', async () => {
      mockPrismaService.post.findUnique.mockResolvedValue(null);

      await expect(service.findOne(postId)).rejects.toThrow(NotFoundException);
    });
  });
}); 