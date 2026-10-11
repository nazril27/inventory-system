import httpStatus from 'http-status';
import { productService } from '../services/index.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { pick } from '../utils/pick.js';

export const createProduct = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const imgData = {};
  
  if (req.file) {
    imgData.imgUrl = req.file?.path;
    imgData.imgPublicId = req.file?.filename;
    imgData.imgOriginalName = req.file?.originalname;
  }

  const data = { ...req.body, userId, ...imgData };

  const product = await productService.createProduct(data);

  res.status(httpStatus.CREATED).json({
    status: httpStatus.CREATED,
    message: 'Create product success',
    data: product,
  });
});

export const getProducts = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'category']);
  const options = pick(req.query, ['page', 'limit', 'sortBy']);

  const result = await productService.queryProducts(filter, options);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Get products success',
    data: result,
  });
});

export const getProductById = catchAsync(async (req, res) => {
  const product = await productService.getProductById(req.params.id);

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Get product success',
    data: product,
  });
});

export const updateProduct = catchAsync(async (req, res) => {
  const data = req.body;

  if (req.file) {
    data.imgUrl = req.file?.path;
    data.imgPublicId = req.file?.filename;
    data.imgOriginalName = req.file?.originalname;
  }

  const product = await productService.updateProduct(req.params.id, data);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Update product success',
    data: product,
  });
});

export const deleteProduct = catchAsync(async (req, res) => {
  await productService.deleteProduct(req.params.id);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Delete product success',
    data: null,
  });
});
