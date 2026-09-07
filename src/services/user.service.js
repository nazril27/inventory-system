import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import { prisma } from '../../prisma/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';

export const createUser = async (userBody) => {
  userBody.password = await bcrypt.hash(userBody.password, 12);

  return await prisma.user.create({
    data: userBody,
  });
};

export const getUserByEmail = async (email) => {
  return await prisma.user.findFirst({
    where: { email },
  });
};

export const getUserById = async (id) => {
  return await prisma.user.findFirst({
    where: { id },
  });
};

export const queryUsers = async (filter, options) => {
  const where = {};
  if (filter.name) {
    where.name = {
      contains: filter.name,
      mode: 'insensitive',
    };
  }
  return await paginate(prisma.user, where, options);
};

export const updateUser = async (id, updateBody) => {
  const user = await getUserById(id);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  if (updateBody.password) {
    updateBody.password = await bcrypt.hash(updateBody.password, 12);
  }

  const updateUser = await prisma.user.update({
    where: { id },
    data: updateBody,
  });

  return updateUser;
};

export const deleteUser = async (id) => {
  const user = await getUserById(id);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  await prisma.user.deleteMany({
    where: { id },
  });
};
