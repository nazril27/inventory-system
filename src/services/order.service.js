import httpStatus from 'http-status';
import { prisma } from '../../prisma/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';

export const createOrder = async (userId, orderBody) => {
  const { customerName, customerEmail, items } = orderBody;

  return await prisma.$transaction(async (tx) => {
    let calculatedTotalPrice = 0;
    const preparedOrderItems = [];

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new ApiError(
          httpStatus.NOT_FOUND,
          `Product with id ${item.productId} does not exist`
        );
      }

      if (product.quantityInStock < item.quantity) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Not enough stock for "${product.name}". Only ${product.quantityInStock} remaining`
        );
      }

      await tx.product.update({
        where: { id: product.id },
        data: {
          quantityInStock: {
            decrement: item.quantity,
          },
        },
      });

      const itemPrice = Number(product.price);
      calculatedTotalPrice += itemPrice * item.quantity;

      preparedOrderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        productName: product.name,
      });
    }

    const newOrder = await tx.order.create({
      data: {
        customerName,
        customerEmail,
        totalPrice: calculatedTotalPrice,
        userId,
        status: 'COMPLETED',
        orderItems: {
          create: preparedOrderItems,
        },
      },
      include: {
        orderItems: true,
      },
    });

    return newOrder;
  });
};

export const queryOrders = async (filter, options) => {
  const where = {};
  if (filter.name) {
    where.name = {
      contains: filter.name,
      mode: 'insensitive',
    };
  }

  const paginateOptions = {
    ...options,
    include: {
      orderItems: true,
    },
  };

  return await paginate(prisma.order, where, paginateOptions);
};

export const getOrderById = async (id) => {
  return await prisma.order.findUnique({
    where: { id },
  });
};

export const updateOrder = async (id, updateBody) => {
  const { customerName, customerEmail, status, items } = updateBody;

  return await prisma.$transaction(async (tx) => {
    const existingOrder = await tx.order.findUnique({
      where: { id },
      include: {
        orderItems: true,
      },
    });

    if (!existingOrder) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    }

    let calculatedTotalPrice = existingOrder.totalPrice;
    const preparedOrderItems = [];

    if (items && Array.isArray(items)) {
      for (const oldItem of existingOrder.orderItems) {
        await tx.product.update({
          where: {
            id: oldItem.productId,
          },
          data: {
            quantityInStock: {
              increment: oldItem.quantity,
            },
          },
        });
      }

      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      calculatedTotalPrice = 0;

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new ApiError(
            httpStatus.NOT_FOUND,
            `Product with id ${item.productId} does not exist`
          );
        }

        if (product.quantityInStock < item.quantity) {
          throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Not enough stock for ${product.name}. Only ${product.quantityInStock} remaining`
          );
        }

        await tx.product.update({
          where: { id: product.id },
          data: {
            quantityInStock: {
              decrement: item.quantity,
            },
          },
        });

        const itemPrice = Number(product.price);
        calculatedTotalPrice += itemPrice * item.quantity;

        preparedOrderItems.push({
          productId: product.id,
          quantity: item.quantity,
          unitPrice: product.price,
          productName: product.name,
        });
      }
    }

    const updateOrder = await tx.order.update({
      where: { id },
      data: {
        ...(customerName && { customerName }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(status && { status }),
        totalPrice: calculatedTotalPrice,
        ...(items && {
          orderItems: {
            create: preparedOrderItems,
          },
        }),
      },
      include: {
        orderItems: true,
      },
    });

    return updateOrder;
  });
};

export const deleteOrder = async (id) => {
  const order = await getOrderById(id);

  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  await prisma.order.delete({
    where: { id },
  });
};
