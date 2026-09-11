import 'dotenv/config';
import { DataSource } from 'typeorm';

// import { Language } from '../language/language.entity.js';
// import { User } from '../user/user.entity.js';

export default new DataSource({
  type: 'mysql',

  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),

  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,

  database: process.env.DATABASE_NAME,

  // entities: [
  //   Language,
  //   User,
  // ],

  migrationsRun: false,

  synchronize: false,

  migrations: [
    'src/database/migrations/**/*{.js,.ts}',
  ],
});
