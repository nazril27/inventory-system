import { ExtractJwt, Strategy as JwtStrategy } from 'passport-jwt';
import { prisma } from '../../prisma/prisma.js';
import config from './config.js';
import { tokenTypes } from './tokens.js';

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error('Invalid token type.');
    }

    const user = await prisma.user.findFirst({
      where: { id: payload.sub },
    });
    if (!user) return done(null, false);

    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

export { jwtStrategy };
