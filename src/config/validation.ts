import Joi from "joi";

export const validationSchema = Joi.object({
  APP_NAME: Joi.string().required(),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'stage')
    .default('development'),
  APP_PORT: Joi.number().port().default(3000),
  APP_DEBUG: Joi.boolean().default(false),
  APP_URL: Joi.string().required(),
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
  FILES_PUBLIC_URL: Joi.string().required().trim(),
  PUBLIC_APP_NAME_AZ: Joi.string().required().trim(),
  PUBLIC_APP_NAME_EN: Joi.string().required().trim(),
  PUBLIC_APP_NAME_TR: Joi.string().required().trim(),
  PUBLIC_APP_NAME_RU: Joi.string().required().trim(),
  PUBLIC_APP_NAME_KZ: Joi.string().required().trim(),
  PUBLIC_APP_NAME_TM: Joi.string().required().trim(),
  PUBLIC_APP_URL_AZ: Joi.string().required().trim(),
  PUBLIC_APP_URL_EN: Joi.string().required().trim(),
  PUBLIC_APP_URL_TR: Joi.string().required().trim(),
  PUBLIC_APP_URL_RU: Joi.string().required().trim(),
  PUBLIC_APP_URL_KZ: Joi.string().required().trim(),
  PUBLIC_APP_URL_TM: Joi.string().required().trim(),
});
