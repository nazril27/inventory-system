import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError.js';

const authorize = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid session'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(
          httpStatus.FORBIDDEN,
          `Role ${req.user.role} can not access this resource`
        )
      );
    }
    next();
  };
};

export { authorize };
