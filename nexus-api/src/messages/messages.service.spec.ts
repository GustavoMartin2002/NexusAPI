import { MessagesService } from './messages.service';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { PersonService } from 'src/person/person.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateMessageDto } from './dto/create-message.dto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UpdateMessageDto } from './dto/update-message.dto';

describe('MessageService', () => {
  let service: MessagesService;
  let messageRepository: Repository<Message>;
  let personService: PersonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(Message),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PersonService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get(MessagesService);
    personService = module.get(PersonService);
    messageRepository = module.get(getRepositoryToken(Message));
  });

  test('must be defined', () => {
    expect(service).toBeDefined();
    expect(messageRepository).toBeDefined();
    expect(personService).toBeDefined();
  });

  describe('create', () => {
    test('success, create a new message', async () => {
      const tokenPayload = { sub: 0 } as any;
      const createMessageDto: CreateMessageDto = {
        text: 'Hello World!',
        toId: 1,
      };

      const mockFromUser = { id: tokenPayload.sub, name: 'gustavo' };
      const mockToUser = { id: createMessageDto.toId, name: 'destinatario' };

      jest
        .spyOn(personService, 'findOne')
        .mockResolvedValueOnce(mockFromUser as any)
        .mockResolvedValueOnce(mockToUser as any);

      const newMessage = {
        text: createMessageDto.text,
        from: mockFromUser,
        to: mockToUser,
        read: false,
        date: expect.any(Date),
      };

      const saveMessage = {
        ...newMessage,
        id: 1,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(messageRepository, 'create')
        .mockReturnValue(saveMessage as any);
      jest
        .spyOn(messageRepository, 'save')
        .mockResolvedValue(saveMessage as any);

      const result = await service.create(createMessageDto, tokenPayload);

      expect(personService.findOne).toHaveBeenCalledWith(tokenPayload.sub);
      expect(personService.findOne).toHaveBeenCalledWith(createMessageDto.toId);
      expect(messageRepository.create).toHaveBeenCalledWith(newMessage);
      expect(messageRepository.save).toHaveBeenCalledWith(saveMessage);
      expect(result).toEqual({
        ...saveMessage,
        from: {
          id: saveMessage.from.id,
          name: saveMessage.from.name,
        },
        to: {
          id: saveMessage.to.id,
          name: saveMessage.to.name,
        },
      });
    });

    test('error, NotFoundException when from user is not found', async () => {
      const tokenPayload = { sub: 0 } as any;
      const createMessageDto: CreateMessageDto = {
        text: 'Hello World!',
        toId: 1,
      };

      jest.spyOn(personService, 'findOne').mockResolvedValueOnce(null as any);

      const result = service.create(createMessageDto, tokenPayload);

      await expect(result).rejects.toThrow(NotFoundException);
      await expect(result).rejects.toHaveProperty(
        'message',
        'Remetente não encontrado.',
      );
    });

    test('error, NotFoundException when to user is not found', async () => {
      const mockFromUser = { id: 1, name: 'Remetente' };

      jest
        .spyOn(personService, 'findOne')
        .mockResolvedValueOnce(mockFromUser as any)
        .mockResolvedValueOnce(null as any);

      const tokenPayload = { sub: 1 } as any;
      const createMessageDto: CreateMessageDto = {
        text: 'Hello World!',
        toId: 2,
      };

      const result = service.create(createMessageDto, tokenPayload);

      await expect(result).rejects.toThrow(NotFoundException);
      await expect(result).rejects.toHaveProperty(
        'message',
        'Destinatário não encontrado.',
      );
    });
  });

  describe('findOne', () => {
    test('success, find a message by id', async () => {
      const idMessage = 1;
      const message = {
        id: idMessage,
        text: 'Hello World!',
        read: false,
        date: new Date(),
        createdAt: new Date(),
        updateAt: new Date(),
        from: {
          id: 1,
          name: 'Remetente',
        },
        to: {
          id: 2,
          name: 'Destinatário',
        },
      };

      jest
        .spyOn(messageRepository, 'findOne')
        .mockResolvedValue(message as any);

      const result = await service.findOne(idMessage);

      expect(messageRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: idMessage,
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
      expect(result).toEqual(message);
    });

    test('error, NotFoundException message', async () => {
      const idMessage = 1;

      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(null as any);

      const result = service.findOne(idMessage);

      await expect(result).rejects.toThrow(NotFoundException);
      await expect(result).rejects.toHaveProperty(
        'message',
        'Mensagem não encontrada.',
      );
    });
  });

  describe('findAll', () => {
    test('success, find all messages', async () => {
      const paginationDto = {
        limit: 10,
        offset: 0,
      };
      const messages = [
        {
          id: 1,
          text: 'Hello World!',
          read: false,
          date: new Date(),
          createdAt: new Date(),
          updateAt: new Date(),
          from: {
            id: 1,
            name: 'Remetente',
          },
          to: {
            id: 2,
            name: 'Destinatário',
          },
        },
      ];

      jest.spyOn(messageRepository, 'find').mockResolvedValue(messages as any);

      const result = await service.findAll();

      expect(messageRepository.find).toHaveBeenCalledWith({
        take: paginationDto.limit,
        skip: paginationDto.offset,
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
      expect(result).toEqual(messages);
    });

    test('error, NotFoundException messages', async () => {
      jest.spyOn(messageRepository, 'find').mockResolvedValue(null as any);

      const result = service.findAll();

      await expect(result).rejects.toThrow(NotFoundException);
      await expect(result).rejects.toHaveProperty(
        'message',
        'Mensagens não encontradas.',
      );
    });
  });

  describe('update', () => {
    test('success, update a message', async () => {
      const idMessage = 1;
      const updateMessageDto: UpdateMessageDto = {
        text: 'Hello Updated World!',
      };
      const tokenPayload = { sub: 1 } as any;

      const message = {
        id: idMessage,
        text: 'Hello World!',
        read: false,
        date: new Date(),
        createdAt: new Date(),
        updateAt: new Date(),
        from: {
          id: 1,
          name: 'Remetente',
        },
        to: {
          id: 2,
          name: 'Destinatário',
        },
      };

      const updatedMessage = { ...message, ...updateMessageDto };

      jest
        .spyOn(messageRepository, 'findOne')
        .mockResolvedValue(message as any);
      jest
        .spyOn(messageRepository, 'save')
        .mockResolvedValue(updatedMessage as any);

      const result = await service.update(
        idMessage,
        updateMessageDto,
        tokenPayload,
      );

      expect(messageRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: idMessage,
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
      expect(messageRepository.save).toHaveBeenCalledWith(updatedMessage);
      expect(result).toEqual(updatedMessage);
    });

    test('error, NotFoundException id message', async () => {
      const idMessage = 1;
      const updateMessageDto: UpdateMessageDto = {
        text: 'Hello Updated World!',
      };
      const tokenPayload = { sub: 1 } as any;

      jest.spyOn(service, 'findOne').mockResolvedValue(null as any);

      const result = service.update(idMessage, updateMessageDto, tokenPayload);

      await expect(result).rejects.toThrow(NotFoundException);
      await expect(result).rejects.toHaveProperty(
        'message',
        'Mensagem não encontrada.',
      );
    });

    test('error, ForbiddenException message not from user', async () => {
      const idMessage = 1;
      const tokenPayload = { sub: 2 } as any;
      const updatedMessage = { text: 'New text' } as any;
      const message = { id: idMessage, from: { id: 1 } } as any;

      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(message);

      const result = service.update(idMessage, updatedMessage, tokenPayload);

      await expect(result).rejects.toThrow(ForbiddenException);
      await expect(result).rejects.toHaveProperty(
        'message',
        'Você não tem autorização para atualizar essa mensagem.',
      );
    });
  });

  describe('delete', () => {
    test('success, delete a message', async () => {
      const idMessage = 1;
      const tokenPayload = { sub: 1 } as any;
      const message = { id: idMessage, from: { id: 1 } } as any;

      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(message);
      jest.spyOn(messageRepository, 'delete').mockResolvedValue(message);

      const result = await service.remove(idMessage, tokenPayload);

      expect(messageRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: idMessage,
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
      expect(messageRepository.delete).toHaveBeenCalledWith(message.id);
      expect(result).toEqual(message);
    });

    test('error, NotFoundException id message', async () => {
      const idMessage = 1;
      const tokenPayload = { sub: 1 } as any;

      jest.spyOn(service, 'findOne').mockResolvedValue(null as any);

      const result = service.remove(idMessage, tokenPayload);

      await expect(result).rejects.toThrow(NotFoundException);
      await expect(result).rejects.toHaveProperty(
        'message',
        'Mensagem não encontrada.',
      );
    });

    test('error, ForbiddenException message not from user', async () => {
      const idMessage = 1;
      const tokenPayload = { sub: 2 } as any;
      const message = { id: idMessage, from: { id: 1 } } as any;

      jest.spyOn(messageRepository, 'findOne').mockResolvedValue(message);

      const result = service.remove(idMessage, tokenPayload);

      await expect(result).rejects.toThrow(ForbiddenException);
      await expect(result).rejects.toHaveProperty(
        'message',
        'Você não tem autorização para deletar essa mensagem.',
      );
    });
  });
});
