import Joi from "joi";

export const validationSchema = Joi.object({
  APP_NAME: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'stage')
    .default('development'),
  APP_PORT: Joi.number().port().default(3000),
  APP_DEBUG: Joi.boolean().default(false),
  DATABASE_HOST: Joi.string().required(),
  DATABASE_PORT: Joi.number().port().required(),
  DATABASE_NAME: Joi.string().required(),
  DATABASE_USERNAME: Joi.string().required(),
  DATABASE_PASSWORD: Joi.string().required(),
  LOCAL_STORAGE_PATH: Joi.string().required(),
  JWT_ACCESS_SECRET: Joi.string().required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().required(),
  REFRESH_TOKEN_TTL_DAYS: Joi.string().optional()
    .pattern(/^\d$/),
});
