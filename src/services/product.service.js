import httpStatus from 'http-status';
import { prisma } from '../../prisma/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { paginate } from '../utils/paginate.js';
import { v2 as cloudinary } from 'cloudinary';


export const queryProducts = async (filter, options) => {
  const where = {};
  if (filter.name) {
    where.name = {
      contains: filter.name,
      mode: 'insensitive',
    };
  }
  if (filter.category) {
    where.category = {
      name: {
        contains: filter.category,
        mode: 'insensitive',
      },
    };
  }
  return await paginate(prisma.product, where, options);
};

export const getProductById = async (id) => {
  return await prisma.product.findFirst({
    where: { id },
  });
};

export const createProduct = async (productBody) => {
  return await prisma.product.create({
    data: productBody,
  });
};

export const updateProduct = async (id, updateBody) => {
  const product = await getProductById(id);

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  if (updateBody.imgUrl && updateBody.imgPublicId && updateBody.imgOriginalName) {
    if (product.imgPublicId) {
      const cloudinaryResult = await cloudinary.uploader.destroy(product.imgPublicId);
      if (cloudinaryResult.result !== 'ok' && cloudinaryResult.result !== 'not found') {
        console.log('Failed to delete image from cloudinary');
      }
    }
  }

  const updateProduct = await prisma.product.update({
    where: { id },
    data: updateBody,
  });

  return updateProduct;
};

export const deleteProduct = async (id) => {
  const product = await getProductById(id);

  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Product not found');
  }

  if (product.imgPublicId) {
    const cloudinaryResult = await cloudinary.uploader.destroy(product.imgPublicId);
    if (cloudinaryResult.result !== 'ok' && cloudinaryResult.result !== 'not found') {
      console.log('Failed to delete image from cloudinary');
    }
  }

  await prisma.product.deleteMany({
    where: { id },
  });
};
