import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { prisma } from '../../prisma/prisma.js';

const password = 'password1';
const salt = bcrypt.genSaltSync(8);
const hashedPassword = bcrypt.hashSync(password, salt);

class User {
  constructor(role, password) {
    this.id = faker.string.uuid();
    this.name = faker.person.fullName();
    this.email = faker.internet.email().toLowerCase();
    this.password = password;
    this.role = role;
  }
}

export const userOne = new User('USER', password);
export const userTwo = new User('USER', password);
export const admin = new User('ADMIN', password);

export const insertUsers = async (users) => {
  users = users.map((user) => ({
    ...user,
    email: user.email.toLowerCase(),
    password: hashedPassword,
  }));
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });
};
