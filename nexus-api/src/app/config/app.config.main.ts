import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ParseIntIdPipe } from 'src/common/pipes/parse-int-id.pipe';

export default (app: INestApplication) => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: false,
    }),
    new ParseIntIdPipe(),
  );
  return app;
};
