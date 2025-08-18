import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  Scope,
} from '@nestjs/common';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PersonService } from 'src/person/person.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { ResponseMessageDto } from './dto/response-message.dto';

@Injectable({ scope: Scope.DEFAULT })
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly personSevice: PersonService,
  ) {}

  // FIND ALL
  async findAll(paginationDto?: PaginationDto): Promise<ResponseMessageDto[]> {
    const { limit = 10, offset = 0 } = paginationDto ?? {};
    const messages = await this.messageRepository.find({
      take: limit,
      skip: offset,
      relations: ['from', 'to'],
      order: {
        id: 'desc',
      },
      select: {
        from: {
          id: true,
          name: true,
        },
        to: {
          id: true,
          name: true,
        },
      },
    });

    if (!messages) throw new NotFoundException('Mensagens não encontradas.');

    return messages;
  }

  // FIND ONE
  async findOne(id: number): Promise<ResponseMessageDto> {
    const message = await this.messageRepository.findOne({
      where: {
        id,
      },
      relations: ['from', 'to'],
      order: {
        id: 'desc',
      },
      select: {
        from: {
          id: true,
          name: true,
        },
        to: {
          id: true,
          name: true,
        },
      },
    });

    if (!message) throw new NotFoundException('Mensagem não encontrada.');

    return message;
  }

  // CREATE
  async create(
    createMessageDto: CreateMessageDto,
    tokenPayload: TokenPayloadDto,
  ): Promise<ResponseMessageDto> {
    const { toId } = createMessageDto;
    const from = await this.personSevice.findOne(tokenPayload.sub);
    const to = await this.personSevice.findOne(toId);

    if (!from) throw new NotFoundException('Remetente não encontrado.');
    if (!to) throw new NotFoundException('Destinatário não encontrado.');

    const newMessage = {
      text: createMessageDto.text,
      from,
      to,
      read: false,
      date: new Date(),
    };

    const message = this.messageRepository.create(newMessage);
    await this.messageRepository.save(message);

    return {
      ...message,
      from: {
        id: message.from.id,
        name: message.from.name,
      },
      to: {
        id: message.to.id,
        name: message.to.name,
      },
    };
  }

  // UPDATE
  async update(
    id: number,
    updateMessageDto: UpdateMessageDto,
    tokenPayload: TokenPayloadDto,
  ): Promise<ResponseMessageDto> {
    const message = await this.findOne(id);

    if (!message) throw new NotFoundException('Mensagem não encontrada.');
    if (message.from.id !== tokenPayload.sub)
      throw new ForbiddenException(
        'Você não tem autorização para atualizar essa mensagem.',
      );

    message.text = updateMessageDto?.text ?? message.text;
    message.read = updateMessageDto?.read ?? message.read;

    await this.messageRepository.save(message);
    return message;
  }

  // DELETE
  async remove(
    id: number,
    tokenPayload: TokenPayloadDto,
  ): Promise<ResponseMessageDto> {
    const message = await this.findOne(id);

    if (!message) throw new NotFoundException('Mensagem não encontrada.');
    if (message.from.id !== tokenPayload.sub)
      throw new ForbiddenException(
        'Você não tem autorização para deletar essa mensagem.',
      );

    await this.messageRepository.delete(message.id);
    return message;
  }
}
