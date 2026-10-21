import 'dotenv/config';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { type SeederOptions } from 'typeorm-extension';

const options: DataSourceOptions & SeederOptions = {
  type: 'mysql',

  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),

  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,

  database: process.env.DATABASE_NAME,

  entities: ['src/**/*.entity{.js,.ts}'],

  migrationsRun: false,
  synchronize: false,

  migrations: ['src/database/migrations/**/*{.js,.ts}'],

  seeds: ['src/database/seeds/**/*{.js,.ts}'],
};

export default new DataSource(options);
