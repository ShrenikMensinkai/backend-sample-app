export class PostDetailResponseDto {
  id: number;
  title: string;
  content: string;
  author: {
    username: string;
  };
  createdAt: string; // ISO8601 format
}
