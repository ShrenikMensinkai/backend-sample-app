export class CommentListItemDto {
  id: number;
  content: string;
  author: {
    username: string;
  };
  createdAt: string; // ISO8601 format
}

export class CommentListResponseDto {
  comments: CommentListItemDto[];
  nextCursor: number | null;
}

export class CommentDetailResponseDto extends CommentListItemDto {
  postId: number;
}
