import express from 'express';
import authRoute from './auth.route.js';
import categoryRoute from './category.route.js';
import docsRoute from './docs.route.js';
import orderRoute from './order.route.js';
import productRoute from './product.route.js';
import userRoute from './user.route.js';

const router = express.Router();

const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/categories',
    route: categoryRoute,
  },
  {
    path: '/products',
    route: productRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/orders',
    route: orderRoute,
  },
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export { router };
