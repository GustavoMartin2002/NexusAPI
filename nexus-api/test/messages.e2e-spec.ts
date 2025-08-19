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

describe('MessagesController (e2e)', () => {
  let app: INestApplication;
  let createPersonDto1: CreatePersonDto;
  let createPersonDto2: CreatePersonDto;
  let loginDto: LoginDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({}),
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
    }).compile();

    app = module.createNestApplication();
    appConfigMain(app);
    await app.init();

    const timestamp = Date.now();
    createPersonDto1 = {
      email: `gustavo${timestamp}@gmail.com`,
      password: 'password',
      name: 'Gustavo Lima Martin',
    };

    createPersonDto2 = {
      email: `mirele${timestamp}@gmail.com`,
      password: 'password',
      name: 'Mirele dos Santos Dias de Araújo',
    };

    loginDto = {
      email: createPersonDto1.email,
      password: createPersonDto1.password,
    };
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/messages (POST) - create', () => {
    test('success, create a message', async () => {
      const personResponse1 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      const createMessageDto = {
        text: 'Hello, this is a test message',
        toId: personResponse2.body.id,
      };

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send(createMessageDto)
        .expect(HttpStatus.CREATED);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: response.body.id,
        text: response.body.text,
        read: response.body.read,
        date: expect.any(String),
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
        from: {
          id: personResponse1.body.id,
          name: personResponse1.body.name,
        },
        to: {
          id: personResponse2.body.id,
          name: personResponse2.body.name,
        },
      });
    });

    test('error, NotFoundException', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({ text: 'Hello, this is a test message', toId: 7 })
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('Pessoa não encontrada');
    });

    test('error, unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .post('/messages')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Usuário não logado!');
    });
  });

  describe('/messages (GET) - findAll', () => {
    test('success, find all messages', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          text: 'Hello, this is a test message',
          toId: personResponse2.body.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .get('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({ offset: 0, limit: 10 })
        .expect(HttpStatus.OK);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: expect.any(Number),
          text: expect.any(String),
          read: expect.any(Boolean),
          date: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          from: {
            id: expect.any(Number),
            name: expect.any(String),
          },
          to: {
            id: expect.any(Number),
            name: expect.any(String),
          },
        },
      ]);
    });

    test('error, unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Usuário não logado!');
    });
  });

  describe('/messages/:id (GET) - findOne', () => {
    test('success, find one message', async () => {
      const personResponse1 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      const messageResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          text: 'Hello, this is a test message',
          toId: personResponse2.body.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .get(`/messages/${messageResponse.body.id}`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: messageResponse.body.id,
        text: messageResponse.body.text,
        read: messageResponse.body.read,
        date: expect.any(String),
        createdAt: messageResponse.body.createdAt,
        updatedAt: messageResponse.body.updatedAt,
        from: {
          id: personResponse1.body.id,
          name: personResponse1.body.name,
        },
        to: {
          id: personResponse2.body.id,
          name: personResponse2.body.name,
        },
      });
    });

    test('error, NotFoundException message', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .get('/messages/7')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('Mensagem não encontrada.');
    });

    test('error, unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .get('/messages/7')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Usuário não logado!');
    });
  });

  describe('/messages/:id (PATCH) - update', () => {
    test('success, update a message', async () => {
      const personResponse1 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      const messageResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          text: 'Hello, this is a test message',
          toId: personResponse2.body.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .patch(`/messages/${messageResponse.body.id}`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({ text: 'Hello, this is an updated test message' })
        .expect(HttpStatus.OK);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: messageResponse.body.id,
        text: 'Hello, this is an updated test message',
        read: messageResponse.body.read,
        date: expect.any(String),
        createdAt: messageResponse.body.createdAt,
        updatedAt: response.body.updatedAt,
        from: {
          id: personResponse1.body.id,
          name: personResponse1.body.name,
        },
        to: {
          id: personResponse2.body.id,
          name: personResponse2.body.name,
        },
      });
    });

    test('error, NotFoundException', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          text: 'Hello, this is a test message',
          toId: personResponse2.body.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .patch(`/messages/7`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({ text: 'Hello, this is an updated test message' })
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('Mensagem não encontrada.');
    });

    test('error, ForbiddenException', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse1 = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      const loginResponse2 = await request(app.getHttpServer())
        .post('/auth')
        .send({
          email: createPersonDto2.email,
          password: createPersonDto2.password,
        })
        .expect(HttpStatus.CREATED);

      const messageResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse1.body.accessToken}`)
        .send({
          text: 'Hello, this is a test message',
          toId: personResponse2.body.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .patch(`/messages/${messageResponse.body.id}`)
        .set('Authorization', `Bearer ${loginResponse2.body.accessToken}`)
        .send({ text: 'Hello, this is an updated test message', read: true })
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body.statusCode).toBe(403);
      expect(response.body.message).toContain(
        'Você não tem autorização para atualizar essa mensagem.',
      );
    });

    test('error, unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send({
          email: createPersonDto1.email,
          password: createPersonDto1.password,
        })
        .expect(HttpStatus.CREATED);

      const messageResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          text: 'Hello, this is a test message',
          toId: personResponse2.body.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .patch(`/messages/${messageResponse.body.id}`)
        .send({ text: 'Hello, this is an updated test message', read: true })
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Usuário não logado!');
    });
  });

  describe('/messages/:id (DELETE) - remove', () => {
    test('success, delete a message', async () => {
      const personResponse1 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send({
          email: createPersonDto1.email,
          password: createPersonDto1.password,
        })
        .expect(HttpStatus.CREATED);

      const messageResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          text: 'Hello, this is a test message',
          toId: personResponse2.body.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .delete(`/messages/${messageResponse.body.id}`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: response.body.id,
        text: response.body.text,
        read: response.body.read,
        date: expect.any(String),
        createdAt: response.body.createdAt,
        updatedAt: response.body.updatedAt,
        from: {
          id: personResponse1.body.id,
          name: personResponse1.body.name,
        },
        to: {
          id: personResponse2.body.id,
          name: personResponse2.body.name,
        },
      });
    });

    test('error, NotFoundException', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          text: 'Hello, this is a test message',
          toId: personResponse2.body.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .delete(`/messages/7`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('Mensagem não encontrada.');
    });

    test('error, ForbiddenException', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse1 = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      const loginResponse2 = await request(app.getHttpServer())
        .post('/auth')
        .send({
          email: createPersonDto2.email,
          password: createPersonDto2.password,
        })
        .expect(HttpStatus.CREATED);

      const messageResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse1.body.accessToken}`)
        .send({
          text: 'Hello, this is a test message',
          toId: personResponse2.body.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .delete(`/messages/${messageResponse.body.id}`)
        .set('Authorization', `Bearer ${loginResponse2.body.accessToken}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body.statusCode).toBe(403);
      expect(response.body.message).toContain(
        'Você não tem autorização para deletar essa mensagem.',
      );
    });

    test('error, unauthorized', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto1)
        .expect(HttpStatus.CREATED);

      const personResponse2 = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto2)
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send(loginDto)
        .expect(HttpStatus.CREATED);

      const messageResponse = await request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          text: 'Hello, this is a test message',
          toId: personResponse2.body.id,
        })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .delete(`/messages/${messageResponse.body.id}`)
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Usuário não logado!');
    });
  });
});
