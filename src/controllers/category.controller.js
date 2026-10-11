import httpStatus from 'http-status';
import { categoryService } from '../services/index.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { pick } from '../utils/pick.js';

export const createCategory = catchAsync(async (req, res) => {
  const category = await categoryService.createCategory(req.body);

  res.status(httpStatus.CREATED).json({
    status: httpStatus.CREATED,
    message: 'Create category success',
    data: category,
  });
});

export const getCategories = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);

  const result = await categoryService.queryCategories(filter, options);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Get categories success',
    data: result,
  });
});

export const getCategoryById = catchAsync(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);

  if (!category) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
  }

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Get category success',
    data: category,
  });
});

export const updateCategory = catchAsync(async (req, res) => {
  const updatedCategory = await categoryService.updateCategoryById(
    req.params.id,
    req.body
  );

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Update category success',
    data: updatedCategory,
  });
});

export const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategoryById(req.params.id);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Delete category success',
    data: null,
  });
});
