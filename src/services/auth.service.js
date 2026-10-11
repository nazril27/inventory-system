import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { ApiError } from '../utils/ApiError.js';
import { tokenService, userService } from './';

export const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const validPassword = await bcrypt.compare(password, user.password);

  if (!validPassword) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  delete user.password;
  return user;
};

export const forgotPassword = async (email) => {
  const user = await userService.getUserByEmail(email);

  if (!user) {
    return null;
  }

  return tokenService.resetPasswordToken(user.id, user.password);
};

export const resetPassword = async (token, newPassword) => {
  const verifyToken = await tokenService.verifyResetPasswordToken(token);

  return await userService.updateUser(verifyToken.userId, {
    password: newPassword,
  });
};
