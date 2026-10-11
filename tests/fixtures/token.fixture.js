import { addDays, addMinutes, subMinutes } from 'date-fns';
import { prisma } from '../../prisma/prisma.js';
import config from '../../src/config/config.js';
import { tokenTypes } from '../../src/config/tokens.js';
import { tokenService } from '../../src/services/index.js';
import { admin, userOne, userTwo } from './user.fixture.js';

const accessTokenExpires = addMinutes(
  new Date(),
  config.jwt.accessExpirationMinutes
);
const refreshTokenExpires = addDays(
  new Date(),
  config.jwt.refreshExpirationDays
);

export const userOneAccessToken = tokenService.generateToken(
  userOne.id,
  accessTokenExpires,
  tokenTypes.ACCESS
);
export const userOneRefreshToken = tokenService.generateToken(
  userOne.id,
  refreshTokenExpires,
  tokenTypes.REFRESH
);
export const userTwoRefreshToken = tokenService.generateToken(
  userTwo.id,
  refreshTokenExpires,
  tokenTypes.REFRESH
);
export const wrongSignToken = tokenService.generateToken(
  userOne.id,
  accessTokenExpires,
  tokenTypes.ACCESS,
  'wrong_secret'
);
export const expiredToken = tokenService.generateToken(
  userOne.id,
  subMinutes(new Date(), config.jwt.accessExpirationMinutes),
  tokenTypes.ACCESS
);

export const adminAccessToken = tokenService.generateToken(
  admin.id,
  accessTokenExpires,
  tokenTypes.ACCESS
);

class TokenDoc {
  constructor(token, userId, expires, type, blacklisted = false) {
    this.token = token;
    this.userId = userId;
    this.expires = expires;
    this.type = type;
    this.blacklisted = blacklisted;
  }
}

export const userOneTokenDoc = new TokenDoc(
  userOneRefreshToken,
  userOne.id,
  refreshTokenExpires,
  tokenTypes.REFRESH
);
export const userTwoTokenDoc = new TokenDoc(
  userTwoRefreshToken,
  userTwo.id,
  refreshTokenExpires,
  tokenTypes.REFRESH
);

export const insertTokens = async (tokens) => {
  await prisma.token.createMany({
    data: tokens,
  });
};
