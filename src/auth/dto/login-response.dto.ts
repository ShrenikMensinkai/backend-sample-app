export class LoginResponseDto {
  access_token: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}
