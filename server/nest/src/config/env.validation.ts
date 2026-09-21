import * as Joi from "joi";

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().optional(),
  COGNITO_USER_POOL_ID: Joi.string().optional(),
  COGNITO_CLIENT_ID: Joi.string().optional(),
  AWS_REGION: Joi.string().optional(),
  CORS_ORIGIN: Joi.string().default("*"),
});
