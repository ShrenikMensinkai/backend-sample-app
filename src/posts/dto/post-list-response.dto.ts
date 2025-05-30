export class PostListItemDto {
  id: number;
  title: string;
  author: {
    username: string;
  };
  createdAt: string; // ISO8601 format
}

export class PostListResponseDto {
  posts: PostListItemDto[];
  total: number;
  page: number;
  totalPages: number;
}
