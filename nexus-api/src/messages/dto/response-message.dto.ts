export class ResponseMessageDto {
  id: number;
  text: string;
  read: boolean;
  date: Date;
  createdAt?: Date;
  updatedAt?: Date;
  from: {
    id: number;
    name: string;
  };
  to: {
    id: number;
    name: string;
  };
}
