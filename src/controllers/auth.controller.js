import httpStatus from 'http-status';
import { tokenTypes } from '../config/tokens.js';
import { authService, tokenService, userService } from '../services/';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';

export const register = catchAsync(async (req, res) => {
  const existingUser = await userService.getUserByEmail(req.body.email);

  if (existingUser) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  const userCreated = await userService.createUser(req.body);
  delete userCreated.password;

  const token = await tokenService.generateAuthTokens(userCreated);

  res.status(httpStatus.CREATED).json({
    status: httpStatus.CREATED,
    message: 'Register success',
    data: { userCreated, token },
  });
});

export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Login success',
    data: { user, tokens },
  });
});

export const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  const deleteToken = await tokenService.revokeToken(
    refreshToken,
    tokenTypes.REFRESH
  );
  if (deleteToken.count === 0) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Token not found');
  }

  res.status(httpStatus.NO_CONTENT).send();
});

export const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  const newTokens = await tokenService.refreshToken(
    refreshToken,
    tokenTypes.REFRESH
  );

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Refresh token success',
    data: newTokens,
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  const resetPasswordToken = await authService.forgotPassword(email);
  console.log(resetPasswordToken);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'A link to reset your password has been sent',
    data: null,
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token, newPassword } = req.body;

  await authService.resetPassword(token, newPassword);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Reset password success',
    data: null,
  });
});
