import express from 'express';
import { productController } from '../../controllers';
import { auth } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { productValidation, queryValidation } from '../../validations';

const router = express.Router();

router
  .route('/')
  .get(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(queryValidation.query),
    productController.getProducts
  )
  .post(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(productValidation.createProduct),
    productController.createProduct
  );

router
  .route('/:id')
  .get(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(productValidation.getProductById),
    productController.getProductById
  )
  .patch(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(productValidation.updateProduct),
    productController.updateProduct
  )
  .delete(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(productValidation.deleteProduct),
    productController.deleteProduct
  );

export default router;
