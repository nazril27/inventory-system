import express from 'express';
import { categoryController } from '../../controllers/index.js';
import { auth } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import { categoryValidation, queryValidation } from '../../validations/index.js';

const router = express.Router();

router
  .route('/')
  .get(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(queryValidation.query),
    categoryController.getCategories
  )
  .post(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(categoryValidation.createCategory),
    categoryController.createCategory
  );

router
  .route('/:id')
  .get(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(categoryValidation.getCategoryById),
    categoryController.getCategoryById
  )
  .patch(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(categoryValidation.updateCategory),
    categoryController.updateCategory
  )
  .delete(
    auth(),
    authorize('ADMIN', 'USER'),
    validate(categoryValidation.deleteCategory),
    categoryController.deleteCategory
  );

export default router;
