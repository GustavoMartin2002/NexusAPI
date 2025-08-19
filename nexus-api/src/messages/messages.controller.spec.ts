import { MessagesController } from './messages.controller';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { UpdateMessageDto } from './dto/update-message.dto';

describe('MessagesController', () => {
  let controller: MessagesController;

  const messagesServiceMock = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(() => {
    controller = new MessagesController(messagesServiceMock as any);
  });

  test('should be defined', () => {
    expect(controller).toBeDefined();
  });

  test('create', async () => {
    const createMessageDto: CreateMessageDto = {
      text: 'hello world!',
      toId: 2,
    };
    const tokenPayload: TokenPayloadDto = { sub: 1 } as any;
    const expected = { id: 1, ...createMessageDto };

    jest.spyOn(messagesServiceMock, 'create').mockResolvedValue(expected);

    const result = await controller.create(createMessageDto, tokenPayload);

    expect(messagesServiceMock.create).toHaveBeenCalledWith(
      createMessageDto,
      tokenPayload,
    );
    expect(result).toEqual(expected);
  });

  test('findAll', async () => {
    const paginationDto: PaginationDto = { offset: 0, limit: 10 };
    const expected = [{ id: 1, text: 'hello world!', toId: 2 }];

    jest.spyOn(messagesServiceMock, 'findAll').mockResolvedValue(expected);

    const result = await controller.findAll(paginationDto);

    expect(messagesServiceMock.findAll).toHaveBeenCalledWith(paginationDto);
    expect(result).toEqual(expected);
  });

  test('findOne', async () => {
    const messageId = 1;
    const expected = { id: 1, text: 'hello world!', toId: 2 };

    jest.spyOn(messagesServiceMock, 'findOne').mockResolvedValue(expected);

    const result = await controller.findOne(messageId);

    expect(messagesServiceMock.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });

  test('update', async () => {
    const messageId = 1;
    const updateMessageDto: UpdateMessageDto = {
      text: 'hello updated world!',
      toId: 2,
    };
    const tokenPayload: TokenPayloadDto = { sub: 1 } as any;
    const expected = { id: 1, ...updateMessageDto };

    jest.spyOn(messagesServiceMock, 'update').mockResolvedValue(expected);

    const result = await controller.update(
      messageId,
      updateMessageDto,
      tokenPayload,
    );

    expect(messagesServiceMock.update).toHaveBeenCalledWith(
      messageId,
      updateMessageDto,
      tokenPayload,
    );
    expect(result).toEqual(expected);
  });

  test('remove', async () => {
    const messageId = 1;
    const tokenPayload: TokenPayloadDto = { sub: 1 } as any;
    const expected = { id: 1, text: 'hello world!', toId: 2 };

    jest.spyOn(messagesServiceMock, 'remove').mockResolvedValue(expected);

    const result = await controller.remove(messageId, tokenPayload);

    expect(messagesServiceMock.remove).toHaveBeenCalledWith(
      messageId,
      tokenPayload,
    );
    expect(result).toEqual(expected);
  });
});
