import { HttpStatus, INestApplication } from '@nestjs/common';
import { CreatePersonDto } from 'src/person/dto/create-person.dto';
import { LoginDto } from 'src/auth/dto/login.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { MessagesModule } from 'src/messages/messages.module';
import { PersonModule } from 'src/person/person.module';
import { AuthModule } from 'src/auth/auth.module';
import appConfigMain from 'src/app/config/app.config.main';
import * as request from 'supertest';
import { RefreshTokenDto } from 'src/auth/dto/refresh-token.dto';
import jwtConfigTest from 'src/auth/config/jwt.config-test';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let createPersonDto: CreatePersonDto;
  let loginDto: LoginDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [jwtConfigTest],
        }),
        TypeOrmModule.forRoot({
          type: process.env.DATABASE_TYPE as 'postgres',
          host: process.env.DATABASE_HOST,
          port: Number(process.env.DATABASE_PORT),
          username: process.env.DATABASE_USERNAME,
          password: process.env.DATABASE_PASSWORD,
          database: 'postgres',
          autoLoadEntities: Boolean(process.env.DATABASE_AUTO_LOAD_ENTITIES),
          synchronize: Boolean(process.env.DATABASE_SYNCHRONIZE),
          dropSchema: true,
        }),
        ServeStaticModule.forRoot({
          rootPath: path.resolve(__dirname, '..', '..', 'pictures'),
          serveRoot: '/pictures',
        }),
        MessagesModule,
        PersonModule,
        AuthModule,
      ],
    })
      .overrideProvider(jwtConfigTest.KEY)
      .useValue(jwtConfigTest())
      .compile();

    app = module.createNestApplication();
    appConfigMain(app);
    await app.init();

    const timestamp = Date.now();
    createPersonDto = {
      email: `test${timestamp}@example.com`,
      password: 'password123',
      name: 'Test User',
    };

    loginDto = {
      email: createPersonDto.email,
      password: createPersonDto.password,
    };
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth (POST) - login', () => {
    test('success, return tokens with valid credentials', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto)
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        accessToken: response.body.accessToken,
        refreshToken: response.body.refreshToken,
      });
    });

    test('error, return Unauthorized with invalid password', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto)
        .expect(HttpStatus.CREATED);

      const invalidLoginDto: LoginDto = {
        email: loginDto.email,
        password: 'wrong_password',
      };

      const response = await request(app.getHttpServer())
        .post('/auth')
        .send(invalidLoginDto)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBe('Senha inválida!');
    });

    test('error, return Unauthorized if user does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBe('Usuário não autorizado!');
    });
  });

  describe('/auth/refresh (POST) - refreshTokens', () => {
    test('success, return new tokens with a valid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      const refreshTokenDto: RefreshTokenDto = {
        refreshToken: loginResponse.body.refreshToken,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send(refreshTokenDto)
        .expect(HttpStatus.CREATED);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        accessToken: response.body.accessToken,
        refreshToken: response.body.refreshToken,
      });
      expect(response.body.refreshToken).not.toBe(
        loginResponse.body.refreshToken,
      );
    });

    test('error, return Unauthorized with an invalid refresh token', async () => {
      const invalidRefreshTokenDto: RefreshTokenDto = {
        refreshToken: 'invalid.token.here',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(invalidRefreshTokenDto)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toBe('Usuário não logado!');
    });

    test('error, return Unauthorized if refresh token is expired', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto)
        .expect(HttpStatus.CREATED);

      const expiredLoginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      await new Promise((resolve) => setTimeout(resolve, 2500));

      const refreshTokenDto = {
        refreshToken: expiredLoginResponse.body.refreshToken,
      };

      const response = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send(refreshTokenDto)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Usuário não logado!');
    });
  });
});
