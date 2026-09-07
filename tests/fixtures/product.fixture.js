import { faker } from '@faker-js/faker';
import { prisma } from '../../prisma/prisma.js';
import { categoryOne } from './category.fixture.js';
import { admin, userOne } from './user.fixture.js';

class Product {
  constructor(userId, categoryId, minQuantity, maxQuantity) {
    this.id = faker.string.uuid();
    this.name = faker.commerce.productName();
    this.description = faker.commerce.productDescription();
    this.price = faker.commerce.price();
    this.quantityInStock = faker.number.int({
      min: minQuantity,
      max: maxQuantity,
    });
    this.categoryId = categoryId;
    this.userId = userId;
  }
}

export const productOne = new Product(userOne.id, categoryOne.id, 20, 100);
export const productTwo = new Product(admin.id, categoryOne.id, 20, 100);

export const insertProducts = async (products) => {
  await prisma.product.createMany({
    data: products,
  });
};
