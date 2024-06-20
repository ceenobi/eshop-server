import { cleanEnv } from "envalid";
import { str, port } from "envalid/dist/validators.js";

export default cleanEnv(process.env, {
  MONGO_URI: str(),
  PORT: port(),
  BREVO_MAIL_KEY: str(),
  HOST: str(),
  USER_MAIL_LOGIN: str(),
  BREVO_PORT: port(),
  BASE_SELLER_URL: str(),
  BASE_CLIENT_URL: str(),
  BASE_SERVER: str(),
  JWT_ACCESS_TOKEN: str(),
  JWT_ACCESS_EXPIRY: str(),
  JWT_REFRESH_TOKEN: str(),
  JWT_REFRESH_EXPIRY: str(),
  CLOUDINARY_NAME: str(),
  CLOUDINARY_APIKEY: str(),
  CLOUDINARY_SECRET: str(),
  CLOUDINARY_UPLOAD_PRESET: str(),
});
