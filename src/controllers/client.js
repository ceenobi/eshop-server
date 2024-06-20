import createHttpError from "http-errors";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { isValidObjectId } from "mongoose";
import { validationResult } from "express-validator";
import NodeCache from "node-cache";
import User from "../models/user.js";
import Merchant from "../models/merchant.js";
import Token from "../models/token.js";
import sendEmail from "../config/sendMail.js";
import {
  generateToken,
  generateRefreshToken,
} from "../config/generateToken.js";
import env from "../utils/validateEnv.js";
import tryCatch from "../config/tryCatchFn.js";
import { uploadSingleImage } from "../config/uploadImages.js";
