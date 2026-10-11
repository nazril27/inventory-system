import express from 'express';
import { orderController } from '../../controllers/index.js';
import { auth } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { orderValidation, queryValidation } from '../../validations/index.js';

const router = express.Router();

router
  .route('/')
  .get(
    auth(),
    authorize('ADMIN'),
    validate(queryValidation.query),
    orderController.getOrders
  )
  .post(
    auth(),
    authorize('ADMIN'),
    validate(orderValidation.createOrder),
    orderController.createOrder
  );

router
  .route('/:id')
  .get(
    auth(),
    authorize('ADMIN'),
    validate(orderValidation.getOrderById),
    orderController.getOrderById
  )
  .patch(
    auth(),
    authorize('ADMIN'),
    validate(orderValidation.updateOrder),
    orderController.updateOrder
  )
  .delete(
    auth(),
    authorize('ADMIN'),
    validate(orderValidation.deleteOrder),
    orderController.deleteOrder
  );

export default router;
