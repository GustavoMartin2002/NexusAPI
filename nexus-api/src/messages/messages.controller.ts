import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { AuthTokenGuard } from 'src/auth/guards/auth-token.guard';
import { TokenPayloadParam } from 'src/auth/params/token-payload.param';
import { TokenPayloadDto } from 'src/auth/dto/token-payload.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { ResponseMessageDto } from './dto/response-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messageService: MessagesService) {}

  // FIND ALL
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Encontrar todas as mensagens' })
  @ApiQuery({
    name: 'offset',
    required: false,
    example: 1,
    description: 'Número de mensagens a serem puladas',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 10,
    description: 'Número máximo de mensagens a serem retornadas',
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagens encontradas',
    type: [ResponseMessageDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Mensagens não encontradas',
    example: new NotFoundException(),
  })
  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.messageService.findAll(paginationDto);
  }

  // FIND ONE
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Encontrar uma mensagem pelo ID' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da mensagem',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem encontrada',
    type: ResponseMessageDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Mensagem não encontrada',
    example: new NotFoundException(),
  })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.findOne(id);
  }

  // CREATE
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar uma nova mensagem' })
  @ApiResponse({
    status: 201,
    description: 'Mensagem criada',
    type: ResponseMessageDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Problema na requisição',
    example: new BadRequestException(),
  })
  @Post()
  create(
    @Body() createMessageDto: CreateMessageDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.messageService.create(createMessageDto, tokenPayload);
  }

  // UPDATE
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar uma mensagem pelo ID' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da mensagem',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem atualizada',
    type: ResponseMessageDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Proibido - Acesso negado',
    example: new ForbiddenException(),
  })
  @ApiResponse({
    status: 404,
    description: 'Mensagem não encontrada',
    example: new NotFoundException(),
  })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMessageDto: UpdateMessageDto,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.messageService.update(id, updateMessageDto, tokenPayload);
  }

  // DELETE
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar uma mensagem pelo ID' })
  @ApiParam({
    name: 'id',
    required: true,
    description: 'ID da mensagem',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Mensagem deletada',
    type: ResponseMessageDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Proibido - Acesso negado',
    example: new ForbiddenException(),
  })
  @ApiResponse({
    status: 404,
    description: 'Mensagem não encontrada',
    example: new NotFoundException(),
  })
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @TokenPayloadParam() tokenPayload: TokenPayloadDto,
  ) {
    return this.messageService.remove(id, tokenPayload);
  }
}
