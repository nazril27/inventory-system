import express from 'express';
import { productController } from '../../controllers/index.js';
import { auth } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { productValidation, queryValidation } from '../../validations/index.js';
import { upload } from '../../lib/cloudinaryUpload.js';

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
    upload.single('image'),
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
    upload.single('image'),
    productController.updateProduct
  )
  .delete(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(productValidation.deleteProduct),
    productController.deleteProduct
  );

export default router;
