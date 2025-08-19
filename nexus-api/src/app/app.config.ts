import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  database: {
    type: process.env.DATABASE_TYPE as 'postgres',
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    username: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_DATABASE,
    autoLoadEntities: Boolean(process.env.DATABASE_AUTO_LOAD_ENTITIES),
    synchronize: Boolean(process.env.DATABASE_SYNCHRONIZE),
  },
  environment: process.env.NODE_ENV || 'development',
}));
