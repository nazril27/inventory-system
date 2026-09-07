import httpStatus from 'http-status';
import { orderService } from '../services/index.js';
import { ApiError } from '../utils/ApiError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { pick } from '../utils/pick.js';

export const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.user.id, req.body);

  res.status(httpStatus.CREATED).json({
    status: httpStatus.CREATED,
    message: 'Create order success',
    data: order,
  });
});

export const getOrders = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name']);
  const options = pick(req.query, ['page', 'limit', 'sortBy', 'include']);

  const result = await orderService.queryOrders(filter, options);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Get orders success',
    data: result,
  });
});

export const getOrderById = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Get order success',
    data: order,
  });
});

export const updateOrder = catchAsync(async (req, res) => {
  const order = await orderService.updateOrder(req.params.id, req.body);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Update order success',
    data: order,
  });
});

export const deleteOrder = catchAsync(async (req, res) => {
  await orderService.deleteOrder(req.params.id);

  res.status(httpStatus.OK).json({
    status: httpStatus.OK,
    message: 'Delete order success',
    data: null,
  });
});
