import { addDays, addMinutes, getUnixTime } from 'date-fns';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import { prisma } from '../../prisma/prisma.js';
import config from '../config/config.js';
import { tokenTypes } from '../config/tokens.js';
import { ApiError } from '../utils/ApiError.js';
import { userService } from './index.js';

export const generateToken = (
  userId,
  expires,
  type,
  secret = config.jwt.secret
) => {
  const payload = {
    sub: userId,
    iat: getUnixTime(new Date()),
    exp: getUnixTime(expires),
    type,
  };
  return jwt.sign(payload, secret);
};

export const saveToken = async (
  token,
  userId,
  expires,
  type,
  blacklisted = false
) => {
  const tokenDoc = await prisma.token.create({
    data: {
      token,
      userId,
      expires,
      type,
      blacklisted,
    },
  });
  return tokenDoc;
};

export const verifyToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await prisma.token.findFirst({
    where: {
      token,
      type,
      userId: payload.sub,
      blacklisted: false,
    },
  });

  if (!tokenDoc) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Token not found.');
  }
  return tokenDoc;
};

export const generateAuthTokens = async (user) => {
  const accessTokenExpires = addMinutes(
    new Date(),
    config.jwt.accessExpirationMinutes
  );
  const accessToken = generateToken(
    user.id,
    accessTokenExpires,
    tokenTypes.ACCESS
  );

  const refreshTokenExpires = addDays(
    new Date(),
    config.jwt.refreshExpirationDays
  );
  const refreshToken = generateToken(
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH
  );
  await saveToken(
    refreshToken,
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH
  );

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires,
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires,
    },
  };
};

export const revokeToken = async (token, type) => {
  return await prisma.token.deleteMany({
    where: {
      token: token,
      type: type,
    },
  });
};

export const refreshToken = async (token, type) => {
  const payload = jwt.verify(token, config.jwt.secret);
  const tokenDoc = await prisma.token.findFirst({
    where: {
      token,
      type,
      userId: payload.sub,
      blacklisted: false,
    },
  });

  const user = await prisma.user.findFirst({
    where: {
      id: payload.sub,
    },
  });

  if (!user || !tokenDoc) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid session or user not found'
    );
  }
  await prisma.token.deleteMany({
    where: {
      id: tokenDoc.id,
    },
  });

  const accessTokenExpires = addMinutes(
    new Date(),
    config.jwt.accessExpirationMinutes
  );
  const accessToken = generateToken(
    user.id,
    accessTokenExpires,
    tokenTypes.ACCESS
  );

  const refreshTokenExpires = new Date(payload.exp * 1000);
  const refreshToken = generateToken(
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH
  );
  await saveToken(
    refreshToken,
    user.id,
    refreshTokenExpires,
    tokenTypes.REFRESH
  );

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires,
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires,
    },
  };
};

export const resetPasswordToken = (userId, userHashPassword) => {
  if (!userId || !userHashPassword) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  const dynamicSecret = `${config.jwt.secret}:${userHashPassword}`;

  return jwt.sign(
    {
      userId,
      type: tokenTypes.RESET_PASSWORD,
    },
    dynamicSecret,
    {
      expiresIn: '15m',
      algorithm: 'HS256',
    }
  );
};

export const verifyResetPasswordToken = async (token) => {
  if (!token || typeof token !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token is required');
  }
  const decoded = jwt.decode(token);
  const userId = decoded?.userId;

  if (!decoded || !userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token format');
  }

  const user = await userService.getUserById(userId);
  if (!user || !user.password) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Invalid token or user not found'
    );
  }

  const dynamicSecret = `${config.jwt.secret}:${user.password}`;
  try {
    return jwt.verify(token, dynamicSecret, { algorithms: ['HS256'] });
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
  }
};
