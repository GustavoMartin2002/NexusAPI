import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/params/token-payload.param';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ResponsePersonDto } from './dto/response-person.dto';

@Controller('person')
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  // FIND ALL
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Encontrar todas as pessoas' })
  @ApiQuery({
    name: 'offset',
    required: false,
    example: 0,
    description: 'Número de pessoas a serem puladas',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Número máximo de pessoas a serem retornadas',
  })
  @ApiResponse({
    status: 200,
    description: 'Pessoas encontradas com sucesso',
    type: [ResponsePersonDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Pessoas não encontradas',
    example: new NotFoundException(),
  })
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.personService.findAll(paginationDto);
  }

  // FIND ONE
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Encontrar uma pessoa pelo ID' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da pessoa',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Pessoa encontrada com sucesso',
    type: ResponsePersonDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Pessoa não encontrada',
    example: new NotFoundException(),
  })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.personService.findOne(id);
  }

  // CREATE
  @ApiOperation({ summary: 'Criar uma nova pessoa' })
  @ApiResponse({
    status: 201,
    description: 'Pessoa criada com sucesso',
    type: ResponsePersonDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Problema na requisição',
    example: new BadRequestException(),
  })
  @ApiResponse({
    status: 409,
    description: 'Conflito - E-mail já cadastrado',
    example: new ConflictException(),
  })
  @Post()
  create(@Body() createPersonDto: CreatePersonDto) {
    return this.personService.create(createPersonDto);
  }

  // UPDATE
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar uma pessoa pelo ID' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da pessoa',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Pessoa atualizada com sucesso',
    type: ResponsePersonDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Proibido - Acesso negado',
    example: new ForbiddenException(),
  })
  @ApiResponse({
    status: 404,
    description: 'Pessoa não encontrada',
    example: new NotFoundException(),
  })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePersonDto: UpdatePersonDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.personService.update(id, updatePersonDto, tokenPayload);
  }

  // DELETE
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar uma pessoa pelo ID' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da pessoa',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Pessoa deletada com sucesso',
    type: ResponsePersonDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Proibido - Acesso negado',
    example: new ForbiddenException(),
  })
  @ApiResponse({
    status: 404,
    description: 'Pessoa não encontrada',
    example: new NotFoundException(),
  })
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.personService.remove(id, tokenPayload);
  }

  // UPLOAD PICTURE
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enviar uma foto de perfil' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Foto de perfil enviada com sucesso',
    type: ResponsePersonDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Problema na requisição',
    example: new BadRequestException(),
  })
  @ApiResponse({
    status: 404,
    description: 'Pessoa não encontrada',
    example: new NotFoundException(),
  })
  @UseInterceptors(FileInterceptor('file'))
  @Post('upload-picture')
  async uploadPicture(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^image\/(jpeg|jpg|png)$/ })
        .addMaxSizeValidator({ maxSize: 10 * (1024 * 1024) })
        .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.personService.uploadPicture(file, tokenPayload);
  }
}
