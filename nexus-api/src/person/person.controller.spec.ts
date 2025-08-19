import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreatePersonDto } from './dto/create-person.dto';
import { PersonController } from './person.controller';

describe('PersonController', () => {
  let controller: PersonController;

  const personServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    uploadPicture: jest.fn(),
  };

  beforeEach(() => {
    controller = new PersonController(personServiceMock as any);
  });

  test('should be defined', () => {
    expect(controller).toBeDefined();
  });

  test('create', async () => {
    const createPersonDto: CreatePersonDto = {
      email: 'gustavo@gmail.com',
      password: 'password',
      name: 'Gustavo',
    };
    const expected = { id: 1, ...createPersonDto };

    jest.spyOn(personServiceMock, 'create').mockResolvedValue(expected);

    const result = await controller.create(createPersonDto);

    expect(personServiceMock.create).toHaveBeenCalledWith(createPersonDto);
    expect(result).toEqual(expected);
  });

  test('findAll', async () => {
    const paginationDto: PaginationDto = { offset: 0, limit: 10 };
    const expected = [{ id: 1, email: 'gustavo@gmail.com', name: 'Gustavo' }];

    jest.spyOn(personServiceMock, 'findAll').mockResolvedValue(expected);

    const result = await controller.findAll(paginationDto);

    expect(personServiceMock.findAll).toHaveBeenCalledWith(paginationDto);
    expect(result).toEqual(expected);
  });

  test('findOne', async () => {
    const personId = 1;
    const expected = {
      id: 1,
      email: 'gustavo@gmail.com',
      password: 'password',
      name: 'Gustavo',
    } as any;

    jest.spyOn(personServiceMock, 'findOne').mockResolvedValue(expected);

    const result = await controller.findOne(personId);

    expect(personServiceMock.findOne).toHaveBeenCalledWith(personId);
    expect(result).toEqual(expected);
  });

  test('update', async () => {
    const personId = 1;
    const updatePersonDto = { name: 'Updated Name' } as any;
    const tokenPayload = { sub: 1 } as any;
    const expected = { id: 1, ...updatePersonDto };

    jest.spyOn(personServiceMock, 'update').mockResolvedValue(expected);

    const result = await controller.update(
      personId,
      updatePersonDto,
      tokenPayload,
    );

    expect(personServiceMock.update).toHaveBeenCalledWith(
      personId,
      updatePersonDto,
      tokenPayload,
    );
    expect(result).toEqual(expected);
  });

  test('remove', async () => {
    const personId = 1;
    const tokenPayload = { sub: 1 } as any;
    const expected = { id: personId, ...tokenPayload };

    jest.spyOn(personServiceMock, 'remove').mockResolvedValue(expected);

    const result = await controller.remove(personId, tokenPayload);

    expect(personServiceMock.remove).toHaveBeenCalledWith(
      personId,
      tokenPayload,
    );
    expect(result).toEqual(expected);
  });

  test('upload-picture', async () => {
    const file: Express.Multer.File = {
      originalname: 'test.jpg',
      mimetype: 'image/jpeg',
    } as any;
    const tokenPayload = { sub: 1 } as any;
    const expected = { id: tokenPayload, ...file };

    jest.spyOn(personServiceMock, 'uploadPicture').mockResolvedValue(expected);

    const result = await controller.uploadPicture(file, tokenPayload);

    expect(personServiceMock.uploadPicture).toHaveBeenCalledWith(
      file,
      tokenPayload,
    );
    expect(result).toEqual(expected);
  });
});
