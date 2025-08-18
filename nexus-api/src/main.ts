import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import appConfigMain from './app/config/app.config.main';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  appConfigMain(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
    app.enableCors({
      origin: process.env.ORIGIN,
    });
  }

  const documentBuilderConfig = new DocumentBuilder()
    .setTitle('NexusAPI')
    .setDescription(
      'Autenticação, Gerenciamento de Usuários e Troca de Mensagens.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilderConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
