import express from 'express';
import { authController } from '../../controllers';
import { validate } from '../../middlewares/validate.js';
import { authValidation } from '../../validations';

const router = express.Router();

router.post(
  '/register',
  validate(authValidation.registerOrCreateUser),
  authController.register
);
router.post('/login', validate(authValidation.login), authController.login);
router.post(
  '/logout',
  validate(authValidation.refreshToken),
  authController.logout
);
router.post(
  '/refresh-token',
  validate(authValidation.refreshToken),
  authController.refresh
);
router.post(
  '/forgot-password',
  validate(authValidation.forgotPassword),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  authController.resetPassword
);

export default router;
