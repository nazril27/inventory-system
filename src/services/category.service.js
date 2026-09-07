import httpStatus from 'http-status';
import { prisma } from '../../prisma/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';

export const createCategory = async (categoryBody) => {
  return await prisma.category.create({
    data: categoryBody,
  });
};

export const queryCategories = async (filter, options) => {
  const where = {};
  if (filter.name) {
    where.name = {
      contains: filter.name,
      mode: 'insensitive',
    };
  }

  return await paginate(prisma.category, where, options);
};

export const getCategoryById = async (id) => {
  return await prisma.category.findFirst({
    where: { id },
  });
};

export const updateCategoryById = async (id, updateBody) => {
  const category = await getCategoryById(id);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const updateCategory = await prisma.category.update({
    where: { id },
    data: updateBody,
  });

  return updateCategory;
};

export const deleteCategoryById = async (id) => {
  const category = await getCategoryById(id);
  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  const deleteCategory = await prisma.category.deleteMany({
    where: { id },
  });

  return deleteCategory;
};
