export class ResponsePersonDto {
  id: number;
  email: string;
  passwordHash: string;
  name: string;
  createdAt?: Date;
  updatedAt?: Date;
  active: boolean;
  picture: string;
}
