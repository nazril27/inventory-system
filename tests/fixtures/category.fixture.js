import { faker } from '@faker-js/faker';
import { prisma } from '../../prisma/prisma.ts';

class Category {
  constructor() {
    this.id = faker.string.uuid();
    this.name = faker.commerce.product();
  }
}

export const categoryOne = new Category();
export const categoryTwo = new Category();
export const categoryThree = new Category();
export const categoryFour = new Category();
export const categoryFive = new Category();

export const insertCategories = async (categories) => {
  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  });
};
