import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { MessagesModule } from 'src/messages/messages.module';
import { PersonModule } from 'src/person/person.module';
import { AuthModule } from 'src/auth/auth.module';
import appConfigMain from 'src/app/config/app.config.main';
import { CreatePersonDto } from 'src/person/dto/create-person.dto';

import { LoginDto } from 'src/auth/dto/login.dto';

describe('PersonController (e2e)', () => {
  let app: INestApplication;
  let createPersonDto: CreatePersonDto;
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

    createPersonDto = {
      email: 'gustavo@gmail.com',
      password: 'password',
      name: 'Gustavo Lima Martin',
    };

    loginDto = {
      email: 'gustavo@gmail.com',
      password: 'password',
    };
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/person (POST) - create', () => {
    test('success, create a person', async () => {
      const response = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto)
        .expect(HttpStatus.CREATED);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        active: true,
        createdAt: expect.any(String),
        email: createPersonDto.email,
        id: expect.any(Number),
        name: createPersonDto.name,
        passwordHash: expect.any(String),
        picture: '',
        updatedAt: expect.any(String),
      });
    });

    test('error, email already used', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto)
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .post('/person')
        .send(createPersonDto)
        .expect(HttpStatus.CONFLICT);

      expect(response.body.statusCode).toBe(409);
      expect(response.body.message).toContain('E-mail já está cadastrado.');
    });
  });

  // describe('/person/upload-picture (POST) - upload-picture', ()=> {
  //   const imgPath = path.join(__dirname, '../test_pictures', 'test.png');

  //   test('pre-test, check if the test image exists', () => {
  //     try {
  //       fs.accessSync(imgPath, fs.constants.F_OK);
  //     } catch (error) {
  //       throw error;
  //     }
  //   });

  // test('success, upload a picture', async ()=> {
  //   await request(app.getHttpServer())
  //     .post('/person')
  //     .send({ ...createPersonDto })
  //     .expect(HttpStatus.CREATED);

  //   const loginResponse = await request(app.getHttpServer())
  //     .post('/auth')
  //     .send({ ...loginDto })
  //     .expect(HttpStatus.CREATED);

  //   const response = await request(app.getHttpServer())
  //     .post('/person/upload-picture')
  //     .set('Authorization', `Bearer ${ loginResponse.body.accessToken }`)
  //     .attach('file', imgPath, {
  //       filename: 'test.png',
  //       // contentType: 'image/png',
  //     })
  //     .expect(HttpStatus.CREATED);

  //   expect(response.status).toBe(201)
  //   expect(response.body).toEqual({
  //     active: true,
  //     createdAt: expect.any(String),
  //     email: createPersonDto.email,
  //     id: expect.any(Number),
  //     name: createPersonDto.name,
  //     passwordHash: expect.any(String),
  //     picture: '1.png',
  //     updatedAt: expect.any(String),
  //   })
  // });

  //   test('error, upload a picture unauthorized', async ()=> {
  //     await request(app.getHttpServer())
  //       .post('/person')
  //       .send({ ...createPersonDto })
  //       .expect(HttpStatus.CREATED);

  //     const loginResponse = await request(app.getHttpServer())
  //       .post('/auth')
  //       .send({ ...loginDto })
  //       .expect(HttpStatus.CREATED);

  //     const response = await request(app.getHttpServer())
  //       .post('/person/upload-picture')
  //       .set('Authorization', `Bearer ${ loginResponse.body.accessToken }`)
  //       .attach('file', imgPath, {
  //         filename: 'error.png',
  //         contentType: 'image/png',
  //       })
  //       .expect(HttpStatus.UNPROCESSABLE_ENTITY);

  //     expect(response.body.statusCode).toBe(422);
  //     // expect(response.body.message).toContain('Validation failed (current file type is image/png, expected type is /(jpg|jpeg|png)$/)');
  //   });
  // });

  describe('/person (GET) - findAll', () => {
    test('success, return all person', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send({ ...createPersonDto })
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send({ ...loginDto })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .get('/person')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([
        {
          active: true,
          createdAt: expect.any(String),
          email: expect.any(String),
          id: expect.any(Number),
          name: expect.any(String),
          passwordHash: expect.any(String),
          picture: expect.any(String),
          updatedAt: expect.any(String),
        },
      ]);
    });

    test('error, person unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .get('/person')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Usuário não logado!');
    });
  });

  describe('/person/:id (GET) - findOne', () => {
    test('success,find a person by id', async () => {
      const personResponse = await request(app.getHttpServer())
        .post('/person')
        .send({ ...createPersonDto })
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send({ ...loginDto })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .get(`/person/${personResponse.body.id}`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({
        active: true,
        createdAt: expect.any(String),
        email: expect.any(String),
        id: expect.any(Number),
        name: expect.any(String),
        passwordHash: expect.any(String),
        picture: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    test('error, person not found', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send({ ...createPersonDto })
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send({ ...loginDto })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .get('/person/7')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('Pessoa não encontrada.');
    });

    test('error, person unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .get('/person/7')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Usuário não logado!');
    });
  });

  describe('/person/:id (PATCH) - update', () => {
    test('success,update a person', async () => {
      const personResponse = await request(app.getHttpServer())
        .post('/person')
        .send({ ...createPersonDto })
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send({ ...loginDto })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .patch(`/person/${personResponse.body.id}`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          name: 'Gustavo',
        })
        .expect(HttpStatus.OK);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        active: true,
        createdAt: expect.any(String),
        email: expect.any(String),
        id: personResponse.body.id,
        name: 'Gustavo',
        passwordHash: expect.any(String),
        picture: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    test('error, person not found', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send({ ...createPersonDto })
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send({ ...loginDto })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .patch('/person/7')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          name: 'Gustavo',
        })
        .expect(HttpStatus.NOT_FOUND);
    });

    test('error, person unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .patch('/person/7')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Usuário não logado!');
    });
  });

  describe('/person/:id (DELETE) - remove', () => {
    test('success,remove a person by id', async () => {
      const personResponse = await request(app.getHttpServer())
        .post('/person')
        .send({ ...createPersonDto })
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send({ ...loginDto })
        .expect(HttpStatus.CREATED);

      const response = await request(app.getHttpServer())
        .delete(`/person/${personResponse.body.id}`)
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.statusCode).toBe(200);
      expect(response.body.email).toBe(personResponse.body.email);
    });

    test('error, person not found', async () => {
      await request(app.getHttpServer())
        .post('/person')
        .send({ ...createPersonDto })
        .expect(HttpStatus.CREATED);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth')
        .send({ ...loginDto })
        .expect(HttpStatus.CREATED);

      await request(app.getHttpServer())
        .delete('/person/7')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    test('error, person unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .delete('/person/7')
        .expect(HttpStatus.UNAUTHORIZED);

      expect(response.body.statusCode).toBe(401);
      expect(response.body.message).toContain('Usuário não logado!');
    });
  });
});
