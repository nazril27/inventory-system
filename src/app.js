import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import { xss } from 'express-xss-sanitizer';
import helmet from 'helmet';
import httpStatus from 'http-status';
import passport from 'passport';
import config from './config/config.js';
import {
  errorHandler as morganError,
  successHandler as morganSuccess,
} from './config/morgan.js';
import { jwtStrategy } from './config/passport.js';
import { errorConverter, errorHandler } from './middlewares/error.js';
import { router } from './routes/v1/index.js';
import { ApiError } from './utils/ApiError.js';

const app = express();

if (config.env !== 'test') {
  app.use(morganSuccess);
  app.use(morganError);
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': ["'self'", 'data:', 'validator.swagger.io'],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
      },
    },
  })
);

app.use(express.json());
app.use(cookieParser());

app.use(express.urlencoded({ extended: true }));

app.use(xss());

app.use(compression());

app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

app.use(cors());

app.use('./uploads', express.static('uploads'));

app.get('/', (_req, res) => {
  res.send('hello world');
});

app.use('/v1', router);

app.use((_req, _res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found.'));
});

app.use(errorConverter);

app.use(errorHandler);

export default app;
export { app };
