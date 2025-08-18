import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthTokenGuard } from './guards/auth-token.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ResponseTokensDto } from './dto/response-tokens.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // LOGIN
  @ApiOperation({ summary: 'Realizar login de um usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário logado com sucesso',
    type: ResponseTokensDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
    example: new UnauthorizedException(),
  })
  @Post()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // REFRESH TOKEN
  @UseGuards(AuthTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar tokens de usuário' })
  @ApiResponse({
    status: 201,
    description: 'Tokens atualizados com sucesso',
    type: ResponseTokensDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Não autorizado',
    example: new UnauthorizedException(),
  })
  @Post('refresh')
  refreshTokens(@Body() refreshToken: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshToken);
  }
}
