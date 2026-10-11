import httpStatus from 'http-status';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import config from '../config/config.js';
import { logger } from '../config/logger.js';
import { ApiError } from '../utils/ApiError.js';

const errorConverter = (err, _req, _res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    // 1. Handle Validasi Zod (Menggunakan error.issues standar resmi Zod)
    if (error instanceof ZodError) {
      const issues = error.issues || [];
      // const message = issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
      const message = issues.map((e) => `${e.message}`).join(', ');
      error = new ApiError(
        httpStatus.BAD_REQUEST,
        `${message}`,
        true,
        err.stack
      );
    }
    // 2. Handle HTTP Error dari Axios / Pihak Ketiga
    else if (error.response) {
      const message =
        err.response.data?.message || err.response.data || err.message;
      const statusCode = error.response.status;

      logger.info('handleAxiosError');
      error = new ApiError(statusCode, message, false, err.stack);
    }
    // 3. Handle Error Prisma Teridentifikasi (P2002, dll)
    else if (err instanceof Prisma.PrismaClientKnownRequestError) {
      logger.info('handlePrismaError');
      error = handlePrismaClientError(err);
    }
    // 4. Handle Gagal Koneksi Database Prisma
    else if (err instanceof Prisma.PrismaClientInitializationError) {
      error = new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Prisma Initialization Error: Database Connection Issues',
        false,
        err.stack
      );
    }
    // 5. Handle Error Validasi Skema Intern Prisma
    else if (err instanceof Prisma.PrismaClientValidationError) {
      logger.error(`Prisma Validation Error: ${err.message}`);
      error = new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Prisma Validation Error: Invalid Input Data',
        false,
        err.stack
      );
    }
    // 6. Handle Error Umum (Unknown Error)
    else {
      const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || httpStatus[statusCode];
      error = new ApiError(statusCode, message, false, err.stack);
    }
  }
  next(error);
};

const handlePrismaClientError = (err) => {
  switch (err.code) {
    case 'P2002':
      return new ApiError(
        httpStatus.BAD_REQUEST,
        `Duplicate field value: ${err.meta?.target || 'unknown'}`,
        false,
        err.stack
      );

    case 'P2014':
      return new ApiError(
        httpStatus.BAD_REQUEST,
        `Invalid ID: ${err.meta?.target || 'unknown'}`,
        false,
        err.stack
      );

    case 'P2003':
      return new ApiError(
        httpStatus.BAD_REQUEST,
        `Foreign key constraint failed: ${err.meta?.target || 'unknown'}`,
        false,
        err.stack
      );

    case 'P2025':
      return new ApiError(
        httpStatus.NOT_FOUND,
        'Record not found',
        false,
        err.stack
      );

    default:
      return new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Database error: ${err.message}`,
        false,
        err.stack
      );
  }
};

const errorHandler = (err, _req, res, _next) => {
  // PENTING: Berikan nilai default jika statusCode atau message bernilai undefined
  let statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || httpStatus[statusCode];

  // Jika production, sembunyikan detail error non-operational demi keamanan
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
  }

  res.locals.errorMessage = message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};

export { errorConverter, errorHandler };
