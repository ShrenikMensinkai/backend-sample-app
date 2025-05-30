export class PostResponseDto {
  id: number;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author: {
    id: number;
    username: string;
  };
}
