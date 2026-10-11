import httpStatus from 'http-status';
import { userService } from '../services/index.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { pick } from '../utils/pick.js';

export const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);

  res.status(httpStatus.CREATED).json({
    status: httpStatus.CREATED,
    message: 'Create user success',
    data: user,
  });
});

export const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'page', 'limit']);

  const result = await userService.queryUsers(filter, options);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Get users success',
    data: result,
  });
});

export const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Get user success',
    data: user,
  });
});

export const getUserByEmail = catchAsync(async (req, res) => {
  const user = await userService.getUserByEmail(req.body.email);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Get user success',
    data: user,
  });
});

export const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Update user success',
    data: user,
  });
});

export const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Delete user success',
    data: null,
  });
});
