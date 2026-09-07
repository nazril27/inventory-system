import { faker } from '@faker-js/faker';
import { prisma } from '../../prisma/prisma.js';
import { orderOne, orderTwo } from './order.fixture.js';
import { productOne, productTwo } from './product.fixture.js';

class OrderItem {
  constructor(orderId, productId, productPrice, productName) {
    this.id = faker.string.uuid();
    this.orderId = orderId;
    this.productId = productId;
    this.quantity = faker.number.int({ min: 1, max: 10 });
    this.unitPrice = productPrice;
    this.productName = productName;
  }
}

export const orderItemOne = new OrderItem(
  orderOne.id,
  productOne.id,
  productOne.price,
  productOne.name
);
export const orderItemTwo = new OrderItem(
  orderOne.id,
  productTwo.id,
  productTwo.price,
  productTwo.name
);
export const orderItemThree = new OrderItem(
  orderTwo.id,
  productTwo.id,
  productTwo.price,
  productTwo.name
);
export const orderItemFour = new OrderItem(
  orderTwo.id,
  productOne.id,
  productOne.price,
  productOne.name
);

export const insertOrderItems = async (orderItems) => {
  await prisma.orderItem.createMany({
    data: orderItems,
    skipDuplicates: true,
  });
};
