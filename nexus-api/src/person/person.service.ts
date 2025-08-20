import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Person } from './entities/person.entity';
import { Repository } from 'typeorm';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { HashingServiceProtocol } from 'src/auth/hashing/hashing.service';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ResponsePersonDto } from './dto/response-person.dto';

@Injectable()
export class PersonService {
  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
    private readonly hashingService: HashingServiceProtocol,
  ) {}

  // FIND ALL
  async findAll(paginationDto?: PaginationDto): Promise<ResponsePersonDto[]> {
    const { limit = 10, offset = 0 } = paginationDto ?? {};
    const person = await this.personRepository.find({
      take: limit,
      skip: offset,
      order: {
        id: 'asc',
      },
    });

    if (!person) throw new NotFoundException('Pessoas não encontradas.');

    return person;
  }

  // FIND ONE
  async findOne(id: number): Promise<ResponsePersonDto> {
    const person = await this.personRepository.findOneBy({
      id,
    });

    if (!person) throw new NotFoundException('Pessoa não encontrada.');

    return person;
  }

  // CREATE
  async create(createPersonDto: CreatePersonDto): Promise<ResponsePersonDto> {
    try {
      const passwordHash = await this.hashingService.hash(
        createPersonDto.password,
      );

      const personData = {
        name: createPersonDto.name,
        email: createPersonDto.email,
        passwordHash,
      };

      const newPerson = this.personRepository.create(personData);
      await this.personRepository.save(newPerson);

      return newPerson;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('E-mail já está cadastrado.');
      }

      throw error;
    }
  }

  // UPDATE
  async update(
    id: number,
    updatePersonDto: UpdatePersonDto,
    tokenPayload: TokenPayloadDto,
  ): Promise<ResponsePersonDto> {
    const personData = {
      name: updatePersonDto?.name,
      email: updatePersonDto?.email,
    };

    if (updatePersonDto?.password) {
      const passwordHash = await this.hashingService.hash(
        updatePersonDto.password,
      );
      personData['passwordHash'] = passwordHash;
    }

    const person = await this.personRepository.preload({
      id,
      ...personData,
    });

    if (!person) throw new NotFoundException('Pessoa não encontrada.');
    if (person.id !== tokenPayload.sub)
      throw new ForbiddenException('Você não tem autorização para atualizar essa pessoa.');

    await this.personRepository.save(person);
    return person;
  }

  // DELETE
  async remove(
    id: number,
    tokenPayload: TokenPayloadDto,
  ): Promise<ResponsePersonDto> {
    const person = await this.findOne(id);

    if (!person) throw new NotFoundException('Pessoa não encontrada.');
    if (person.id !== tokenPayload.sub)
      throw new ForbiddenException('Você não tem autorização para deletar essa pessoa.');

    await this.personRepository.delete(person.id);
    return person;
  }

  // UPLOAD PICTURE
  async uploadPicture(
    file: Express.Multer.File,
    tokenPayload: TokenPayloadDto,
  ): Promise<ResponsePersonDto> {
    if (file.size < 1024)
      throw new BadRequestException('Arquivo muito pequeno!');

    const person = await this.findOne(tokenPayload.sub);
    if (!person) throw new NotFoundException('Falha ao encontrar usuário.');

    const fileExtension = path
      .extname(file.originalname)
      .toLowerCase()
      .substring(1);
    const fileName = `${tokenPayload.sub}.${fileExtension}`;
    const pictureDir = path.resolve(process.cwd(), 'pictures');
    const fileFullPath = path.join(pictureDir, fileName);

    await fs.mkdir(pictureDir, { recursive: true });

    await fs.writeFile(fileFullPath, file.buffer);

    person.picture = fileName;
    await this.personRepository.save(person);

    return person;
  }
}
