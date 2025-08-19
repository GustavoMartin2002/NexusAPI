import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Person } from 'src/person/entities/person.entity';
import { Repository } from 'typeorm';
import { HashingServiceProtocol } from './hashing/hashing.service';
import { JwtService } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

describe('AuthService', () => {
  let service: AuthService;
  let personRepository: Repository<Person>;
  let hashingService: HashingServiceProtocol;
  let jwtService: JwtService;

  const mockPerson = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed_password',
    active: true,
  } as Person;

  const mockLoginDto: LoginDto = {
    email: 'test@example.com',
    password: 'password123',
  };

  const mockRefreshTokenDto: RefreshTokenDto = {
    refreshToken: 'valid_refresh_token',
  };

  const mockJwtConfig = {
    jwtTtl: 3600,
    jwtRefreshTtl: 86400,
    secret: 'test-secret',
    audience: 'test-audience',
    issuer: 'test-issuer',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Person),
          useValue: {
            findOneBy: jest.fn(),
          },
        },
        {
          provide: HashingServiceProtocol,
          useValue: {
            compare: jest.fn(),
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: mockJwtConfig,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    personRepository = module.get<Repository<Person>>(
      getRepositoryToken(Person),
    );
    hashingService = module.get<HashingServiceProtocol>(HashingServiceProtocol);
    jwtService = module.get<JwtService>(JwtService);
  });

  test('must be defined', () => {
    expect(service).toBeDefined();
    expect(personRepository).toBeDefined();
    expect(hashingService).toBeDefined();
    expect(jwtService).toBeDefined();
  });

  describe('login', () => {
    test('success, return tokens on successful login', async () => {
      jest.spyOn(personRepository, 'findOneBy').mockResolvedValue(mockPerson);
      jest.spyOn(hashingService, 'compare').mockResolvedValue(true);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');

      const result = await service.login(mockLoginDto);

      expect(personRepository.findOneBy).toHaveBeenCalledWith({
        email: mockLoginDto.email,
        active: true,
      });
      expect(hashingService.compare).toHaveBeenCalledWith(
        mockLoginDto.password,
        mockPerson.passwordHash,
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
    });

    test('error, UnauthorizedException when user is not found', async () => {
      jest.spyOn(personRepository, 'findOneBy').mockResolvedValue(null);

      const result = service.login(mockLoginDto);

      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toHaveProperty(
        'message',
        'Usuário não autorizado!',
      );
    });

    test('error, UnauthorizedException when password is invalid', async () => {
      jest.spyOn(personRepository, 'findOneBy').mockResolvedValue(mockPerson);
      jest.spyOn(hashingService, 'compare').mockResolvedValue(false);

      const result = service.login(mockLoginDto);

      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toHaveProperty('message', 'Senha inválida!');
    });
  });

  describe('refreshTokens', () => {
    test('success, return new tokens if refresh token is valid', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({ sub: mockPerson.id });
      jest.spyOn(personRepository, 'findOneBy').mockResolvedValue(mockPerson);
      jest
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');

      const result = await service.refreshTokens(mockRefreshTokenDto);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        mockRefreshTokenDto.refreshToken,
        mockJwtConfig,
      );
      expect(personRepository.findOneBy).toHaveBeenCalledWith({
        id: mockPerson.id,
        active: true,
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
      });
    });

    test('error, UnauthorizedException if refresh token is invalid', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockRejectedValue(new Error('Token expirado'));

      const result = service.refreshTokens(mockRefreshTokenDto);

      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toHaveProperty('message', 'Token expirado');
    });

    test('error, UnauthorizedException if user from token is not found', async () => {
      jest
        .spyOn(jwtService, 'verifyAsync')
        .mockResolvedValue({ sub: mockPerson.id });
      jest.spyOn(personRepository, 'findOneBy').mockResolvedValue(null);

      const result = service.refreshTokens(mockRefreshTokenDto);

      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toHaveProperty(
        'message',
        'Usuário não autorizado.',
      );
    });
  });
});
