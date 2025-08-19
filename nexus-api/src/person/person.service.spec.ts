import { Repository } from 'typeorm';
import { PersonService } from './person.service';
import { Person } from './entities/person.entity';
import { HashingServiceProtocol } from 'src/auth/hashing/hashing.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreatePersonDto } from './dto/create-person.dto';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';

jest.mock('fs/promises');

describe('PersonService', () => {
  let service: PersonService;
  let personRepository: Repository<Person>;
  let hashingService: HashingServiceProtocol;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonService,
        {
          provide: getRepositoryToken(Person),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOneBy: jest.fn(),
            find: jest.fn(),
            preload: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: HashingServiceProtocol,
          useValue: {
            hash: jest.fn(),
          },
        },
      ],
    }).compile();
    service = module.get(PersonService);
    personRepository = module.get(getRepositoryToken(Person));
    hashingService = module.get(HashingServiceProtocol);
  });

  test('must be defined', () => {
    expect(service).toBeDefined();
    expect(personRepository).toBeDefined();
    expect(hashingService).toBeDefined();
  });

  describe('create', () => {
    test('success, create a new Person', async () => {
      const createPersonDto: CreatePersonDto = {
        email: 'gustavo@gmail.com',
        password: 'gustavo',
        name: 'Gustavo Lima Martin',
      };
      const passwordHash = 'HASH_PASSWORD';
      const personData: CreatePersonDto = {
        email: createPersonDto.email,
        password: passwordHash,
        name: createPersonDto.name,
      };

      jest.spyOn(hashingService, 'hash').mockResolvedValue(passwordHash);
      jest.spyOn(personRepository, 'create').mockReturnValue(personData as any);

      const result = await service.create(createPersonDto);

      expect(hashingService.hash).toHaveBeenCalledWith(
        createPersonDto.password,
      );
      expect(personRepository.create).toHaveBeenCalledWith({
        name: createPersonDto.name,
        passwordHash,
        email: createPersonDto.email,
      });
      expect(personRepository.save).toHaveBeenCalledWith(personData);
      expect(result).toEqual(personData);
    });

    test('error,conflict exception - email already exists', async () => {
      jest.spyOn(personRepository, 'save').mockRejectedValue({
        code: '23505',
      });

      await expect(service.create({} as any)).rejects.toThrow(
        ConflictException,
      );
    });

    test('error, anything error', async () => {
      jest
        .spyOn(personRepository, 'save')
        .mockRejectedValue(new Error('error'));

      await expect(service.create({} as any)).rejects.toThrow(
        new Error('error'),
      );
    });
  });

  describe('findOne', () => {
    test('success, find a person by id', async () => {
      const personId: number = 1;
      const person = {
        id: personId,
        email: 'gustavo2002@gmail.com',
        name: 'Gustavo Lima Martin',
        passwordHash: 'HASH',
      };

      jest
        .spyOn(personRepository, 'findOneBy')
        .mockResolvedValue(person as any);

      const result = await service.findOne(person.id);

      expect(result).toEqual(person);
    });

    test('error, person not found', async () => {
      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    test('success, return all person', async () => {
      const limit = 10;
      const offset = 0;
      const personMock: Person[] = [
        {
          id: 1,
          email: 'gustavo2002@gmail.com',
          name: 'Gustavo Lima Martin',
          passwordHash: 'HASH1',
        } as Person,
        {
          id: 2,
          email: 'gustavo2025@gmail.com',
          name: 'Gustavo',
          passwordHash: 'HASH2',
        } as Person,
      ];

      jest.spyOn(personRepository, 'find').mockResolvedValue(personMock);

      const result = await service.findAll();

      expect(result).toEqual(personMock);
      expect(personRepository.find).toHaveBeenCalledWith({
        take: limit,
        skip: offset,
        order: {
          id: 'asc',
        },
      });
    });

    test('error, people not found', async () => {
      await expect(service.findAll()).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    test('success, update a person', async () => {
      const personId = 1;
      const updatePersonDto = {
        name: 'Gustavo L. Martin',
        password: '1004-0109',
      };
      const tokenPayload = { sub: personId } as any;
      const passwordHash = 'HASH_PASSWORD';
      const personData = {
        id: personId,
        name: updatePersonDto.name,
        passwordHash,
      };

      jest.spyOn(hashingService, 'hash').mockResolvedValue(passwordHash);
      jest
        .spyOn(personRepository, 'preload')
        .mockResolvedValue(personData as any);
      jest.spyOn(personRepository, 'save').mockResolvedValue(personData as any);

      const result = await service.update(
        personId,
        updatePersonDto,
        tokenPayload,
      );

      expect(hashingService.hash).toHaveBeenCalledWith(
        updatePersonDto.password,
      );
      expect(personRepository.preload).toHaveBeenCalledWith(personData);
      expect(personRepository.save).toHaveBeenCalledWith(personData);
      expect(result).toEqual(personData);
    });

    test('error, person not found', async () => {
      const personId = 1;
      const updatePersonDto = { name: 'Gustavo L. Martin' };
      const tokenPayload = { sub: personId } as any;

      jest.spyOn(personRepository, 'preload').mockResolvedValue(null as any);

      expect(
        service.update(personId, updatePersonDto, tokenPayload),
      ).rejects.toThrow(NotFoundException);
    });

    test('error, unauthorized person', async () => {
      const personId = 1;
      const updatePersonDto = { name: 'Gustavo L. Martin' };
      const tokenPayload = { sub: 2 } as any;
      const existingPerson = {
        id: personId,
        name: 'Gustavo',
      };

      jest
        .spyOn(personRepository, 'preload')
        .mockResolvedValue(existingPerson as any);

      await expect(
        service.update(personId, updatePersonDto, tokenPayload),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    test('success, remove a person', async () => {
      const personId = 1;
      const tokenPayload = { sub: personId } as any;
      const person = {
        id: personId,
        name: 'Gustavo L. Martin',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(person as any);
      jest.spyOn(personRepository, 'delete').mockResolvedValue(person as any);

      const result = await service.remove(personId, tokenPayload);

      expect(service.findOne).toHaveBeenCalledWith(personId);
      expect(personRepository.delete).toHaveBeenCalledWith(person.id);
      expect(result).toEqual(person);
    });

    test('error, person not found', async () => {
      const personId = 1;
      const tokenPayload = { sub: personId } as any;

      jest.spyOn(service, 'findOne').mockResolvedValue(null as any);

      await expect(service.remove(personId, tokenPayload)).rejects.toThrow(
        NotFoundException,
      );
    });

    test('error, person unauthorized', async () => {
      const personId = 1;
      const tokenPayload = { sub: 2 } as any;
      const existingPerson = {
        id: personId,
        name: 'Gustavo L. Martin',
      };

      jest.spyOn(service, 'findOne').mockResolvedValue(existingPerson as any);

      await expect(service.remove(personId, tokenPayload)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('upload picture', () => {
    test('success, upload picture for person', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        size: 2000,
        buffer: Buffer.from('file content'),
      } as Express.Multer.File;
      const mockPerson = {
        id: 1,
        name: 'Gustavo L. Martin',
        email: 'gustavo@gmail.com',
      } as Person;
      const tokenPayload = { sub: mockPerson.id } as any;

      jest.spyOn(service, 'findOne').mockResolvedValue(mockPerson);
      jest.spyOn(personRepository, 'save').mockResolvedValue({
        ...mockPerson,
        picture: '1.jpg',
      });

      const filePath = path.resolve(process.cwd(), 'pictures', '1.jpg');

      const result = await service.uploadPicture(mockFile, tokenPayload);

      expect(service.findOne).toHaveBeenCalledWith(tokenPayload.sub);
      expect(fs.writeFile).toHaveBeenCalledWith(filePath, mockFile.buffer);
      expect(personRepository.save).toHaveBeenCalledWith({
        ...mockPerson,
        picture: '1.jpg',
      });
      expect(result).toEqual({
        ...mockPerson,
        picture: '1.jpg',
      });
    });

    test('error, small file', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        size: 1023, // < 1024
        buffer: Buffer.from('small content'),
      } as Express.Multer.File;
      const tokenPayload = { sub: 1 } as any;

      await expect(
        service.uploadPicture(mockFile, tokenPayload),
      ).rejects.toThrow(BadRequestException);
    });

    test('error, person not found', async () => {
      const mockFile = {
        originalname: 'test.jpg',
        size: 2000,
        buffer: Buffer.from('file content'),
      } as Express.Multer.File;
      const tokenPayload = { sub: 1 } as any;

      jest.spyOn(service, 'findOne').mockResolvedValue(null as any);

      await expect(
        service.uploadPicture(mockFile, tokenPayload),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
