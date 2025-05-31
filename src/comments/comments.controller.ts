import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  CommentDetailResponseDto,
  CommentListResponseDto,
} from './dto/comment-response.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: {
    id: number;
    emailId: string;
  };
}

@Controller('posts/:postId/comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  async create(
    @Param('postId', ParseIntPipe) postId: number,
    @Request() req: RequestWithUser,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentDetailResponseDto> {
    return this.commentsService.create(postId, req.user.id, createCommentDto);
  }

  @Get()
  async findAll(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() paginationQuery: CursorPaginationDto,
  ): Promise<CommentListResponseDto> {
    return this.commentsService.findAll(postId, paginationQuery);
  }

  @Delete(':id')
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.commentsService.delete(id, req.user.id);
  }
}
