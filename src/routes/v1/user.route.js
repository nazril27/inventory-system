import express from 'express';
import { userController } from '../../controllers/index.js';
import { auth } from '../../middlewares/auth.js';
import { authorize } from '../../middlewares/authorize.js';
import { validate } from '../../middlewares/validate.js';
import {
  authValidation,
  queryValidation,
  userValidation,
} from '../../validations/index.js';

const router = express.Router();

router
  .route('/')
  .get(
    auth(),
    authorize('ADMIN'),
    validate(queryValidation.query),
    userController.getUsers
  )
  .post(
    auth(),
    authorize('ADMIN'),
    validate(authValidation.registerOrCreateUser),
    userController.createUser
  );

router
  .route('/:id')
  .get(
    auth(),
    authorize('ADMIN'),
    validate(userValidation.getUserById),
    userController.getUserById
  )
  .patch(
    auth(),
    authorize('ADMIN'),
    validate(userValidation.updateUser),
    userController.updateUser
  )
  .delete(
    auth(),
    authorize('ADMIN'),
    validate(userValidation.deleteUser),
    userController.deleteUser
  );

export default router;
