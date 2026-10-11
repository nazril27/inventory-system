import httpStatus from 'http-status';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { prisma } from '../../prisma/prisma.js';
import { app } from '../../src/app.js';
import { auth } from '../../src/middlewares/auth.js';
import { tokenService } from '../../src/services/index.js';
import { ApiError } from '../../src/utils/ApiError.js';
import { tokenFixture } from '../fixtures/index.js';
import { insertUsers, userOne } from '../fixtures/user.fixture.js';

describe('Auth Routes', () => {
  describe('POST /v1/auth/register', () => {
    it('should return 201 and successfully register user if request data is ok', async () => {
      const newUser = {
        name: 'New Test User',
        email: 'newuser@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(201);

      expect(res.body.message).toBe('Register success');
      expect(res.body.data).toHaveProperty('userCreated');
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.userCreated.email).toBe(newUser.email);
      expect(res.body.data.userCreated).not.toHaveProperty('password');

      // Verifikasi data tersimpan di database
      const dbUser = await prisma.user.findUnique({
        where: { email: newUser.email },
      });
      expect(dbUser).not.toBeNull();
      expect(dbUser.name).toBe(newUser.name);
    });

    it('should return 400 error if email is invalid', async () => {
      const newUser = {
        name: 'New Test User',
        email: 'invalidemailformat',
        password: 'password123',
      };

      const res = await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(400);

      expect(res.body.message).toBe('Required valid email format');
    });

    it('should return 400 error if email is already used', async () => {
      await insertUsers([userOne]);

      const newUser = {
        name: 'New Test User',
        email: userOne.email,
        password: 'password123',
      };

      const res = await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(400);

      expect(res.body.message).toBe('Email already taken');
    });

    it('should return 400 error if password length is less than 8 characters', async () => {
      const newUser = {
        name: 'New Test User',
        email: 'newuser@example.com',
        password: 'pass33',
      };

      const res = await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(400);

      expect(res.body.message).toBe('Password must be at least 8 characters');
    });

    it('should return 400 error if password does not contain both letters and numbers', async () => {
      const newUser = {
        name: 'New Test User',
        email: 'newuser@example.com',
        password: 'password',
      };

      const res = await request(app)
        .post('/v1/auth/register')
        .send(newUser)
        .expect(400);

      expect(res.body.message).toBe(
        'Password must contain at least 1 letter and 1 number'
      );
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should return 200 and login user if email and password match', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .post('/v1/auth/login')
        .send({
          email: userOne.email,
          password: userOne.password,
        })
        .expect(200);

      expect(res.body.message).toBe('Login success');
      expect(res.body.data).toHaveProperty('tokens');
      expect(res.body.data.user.email).toBe(userOne.email);
    });

    it('should return 401 error if password is wrong', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .post('/v1/auth/login')
        .send({
          email: userOne.email,
          password: 'wrongpassword1',
        })
        .expect(401);

      expect(res.body.message).toBe('Incorrect email or password');
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('should return 204 if user logout success', async () => {
      await insertUsers([userOne]);
      await tokenFixture.insertTokens([tokenFixture.userOneTokenDoc]);

      await request(app)
        .post('/v1/auth/logout')
        .send({
          refreshToken: tokenFixture.userOneRefreshToken,
        })
        .expect(204);

      const token = await prisma.token.findFirst({
        where: { userId: userOne.id },
      });

      expect(token).toBeNull();
    });

    it('should return 400 if refresh token does not exist in body request', async () => {
      const res = await request(app)
        .post('/v1/auth/logout')
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Require refresh token');
    });

    it('should return 404 if refresh token does not exist in database', async () => {
      await insertUsers([userOne]);
      await tokenFixture.insertTokens([tokenFixture.userOneTokenDoc]);

      const res = await request(app)
        .post('/v1/auth/logout')
        .send({
          refreshToken: tokenFixture.userTwoRefreshToken,
        })
        .expect(404);

      expect(res.body.message).toBe('Token not found');
    });
  });

  describe('POST /v1/auth/refresh-token', () => {
    it('should return 200 if refresh token success', async () => {
      await insertUsers([userOne]);
      await tokenFixture.insertTokens([tokenFixture.userOneTokenDoc]);

      const res = await request(app)
        .post('/v1/auth/refresh-token')
        .send({
          refreshToken: tokenFixture.userOneRefreshToken,
        })
        .expect(200);

      expect(res.body.data).toHaveProperty('access');
      expect(res.body.data).toHaveProperty('refresh');
      expect(res.body.message).toBe('Refresh token success');

      const newRefreshToken = await prisma.token.findFirst({
        where: { userId: userOne.id },
      });

      expect(newRefreshToken).not.toBe(tokenFixture.userOneRefreshToken);
    });

    it('should return 400 if refresh token does not exist in body request', async () => {
      const res = await request(app)
        .post('/v1/auth/refresh-token')
        .send({})
        .expect(400);

      expect(res.body.message).toBe('Require refresh token');
    });

    it('should return 401 if user or refresh token does not exist in database', async () => {
      const res = await request(app)
        .post('/v1/auth/refresh-token')
        .send({
          refreshToken: tokenFixture.userOneRefreshToken,
        })
        .expect(401);

      expect(res.body.message).toBe('Invalid session or user not found');
    });
  });

  describe('POST /v1/auth/forgot-password', () => {
    it('should return 200 and success message when given a valid registered email', async () => {
      await insertUsers([userOne]);

      const res = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: userOne.email })
        .expect(httpStatus.OK);

      expect(res.body.status).toBe(httpStatus.OK);
      expect(res.body.message).toBe(
        'A link to reset your password has been sent'
      );
      expect(res.body.data).toBeNull();
    });

    it('should return 200 even if email is not registered to prevent email enumeration', async () => {
      const res = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(httpStatus.OK);

      expect(res.body.status).toBe(httpStatus.OK);
      expect(res.body.message).toBe(
        'A link to reset your password has been sent'
      );
      expect(res.body.data).toBeNull();
    });

    it('should return 400 if email is missing from body', async () => {
      const res = await request(app)
        .post('/v1/auth/forgot-password')
        .send({})
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toBe('Require email');
    });

    it('should return 400 if email format is invalid', async () => {
      const res = await request(app)
        .post('/v1/auth/forgot-password')
        .send({ email: 'invalid-email-format' })
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toBe('Require valid email format');
    });
  });

  describe('POST /v1/auth/reset-password', () => {
    it('should return 200 and successfully reset user password when token is valid', async () => {
      await insertUsers([userOne]);

      const dbUser = await prisma.user.findUnique({
        where: { id: userOne.id },
      });

      const resetToken = tokenService.resetPasswordToken(
        dbUser.id,
        dbUser.password
      );

      const newPassword = 'newPassword123';
      const res = await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword,
        })
        .expect(httpStatus.OK);

      expect(res.body.status).toBe(httpStatus.OK);
      expect(res.body.message).toBe('Reset password success');
      expect(res.body.data).toBeNull();

      // Verifikasi user dapat login menggunakan password baru
      const loginRes = await request(app)
        .post('/v1/auth/login')
        .send({
          email: userOne.email,
          password: newPassword,
        })
        .expect(httpStatus.OK);

      expect(loginRes.body.data.user.email).toBe(userOne.email);

      // Verifikasi password lama sudah tidak valid
      await request(app)
        .post('/v1/auth/login')
        .send({
          email: userOne.email,
          password: userOne.password,
        })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 400 if token is missing in request body', async () => {
      const res = await request(app)
        .post('/v1/auth/reset-password')
        .send({ newPassword: 'newPassword123' })
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toBe('Require reset password token');
    });

    it('should return 400 if newPassword is missing in request body', async () => {
      const res = await request(app)
        .post('/v1/auth/reset-password')
        .send({ token: 'dummy-token' })
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toBeDefined();
    });

    it('should return 400 if newPassword is less than 8 characters', async () => {
      const res = await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: 'dummy-token',
          newPassword: 'pass33',
        })
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toBe('Password must be at least 8 characters');
    });

    it('should return 400 if newPassword does not contain both letters and numbers', async () => {
      const res = await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: 'dummy-token',
          newPassword: 'passwordonly',
        })
        .expect(httpStatus.BAD_REQUEST);

      expect(res.body.message).toBe(
        'Password must contain at least 1 letter and 1 number'
      );
    });

    it('should return 401 if token is invalid or malformed', async () => {
      const res = await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: 'invalid-jwt-token-format',
          newPassword: 'newPassword123',
        })
        .expect(httpStatus.UNAUTHORIZED);

      expect(res.body.message).toBe('Invalid token format');
    });

    it('should return 401 if reset token is reused after password has already been changed', async () => {
      await insertUsers([userOne]);

      const dbUser = await prisma.user.findUnique({
        where: { id: userOne.id },
      });

      const resetToken = tokenService.resetPasswordToken(
        dbUser.id,
        dbUser.password
      );

      // Reset password pertama kali
      await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'newPassword123',
        })
        .expect(httpStatus.OK);

      // Reset kedua kali dengan token yang sama harus ditolak karena dynamic secret (hash password) berubah
      const secondRes = await request(app)
        .post('/v1/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'anotherPassword456',
        })
        .expect(httpStatus.UNAUTHORIZED);

      expect(secondRes.body.message).toBe('Invalid or expired token');
    });
  });
});

describe('Auth Middlewares', () => {
  it('should call next with no errors if access token is valid', async () => {
    await insertUsers([userOne]);

    const req = {
      headers: {
        authorization: `Bearer ${tokenFixture.userOneAccessToken}`,
      },
    };
    const res = {};
    const next = vi.fn();

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(userOne.id);
  });

  it('should call next with unauthorized error if access token is not found in header', async () => {
    const req = {
      headers: {},
    };
    const res = {};
    const next = vi.fn();

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect(next.mock.calls[0][0].message).toBe('Please authenticate.');
  });

  it('should call next with unauthorized error if access token is not a valid jwt token', async () => {
    const req = {
      headers: {
        authorization: 'random_invalid_string_123',
      },
    };
    const res = {};
    const next = vi.fn();

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect(next.mock.calls[0][0].message).toBe('Please authenticate.');
  });

  it('should call next with unauthorized error if the token is not an access token', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${tokenFixture.userOneRefreshToken}`,
      },
    };
    const res = {};
    const next = vi.fn();

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect(next.mock.calls[0][0].message).toBe('Please authenticate.');
  });

  it('should call next with unauthorized error if access token is generated with an invalid secret', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${tokenFixture.wrongSignToken}`,
      },
    };
    const res = {};
    const next = vi.fn();

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect(next.mock.calls[0][0].message).toBe('Please authenticate.');
  });

  it('should call next with unauthorized error if access token is expired', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${tokenFixture.expiredToken}`,
      },
    };
    const res = {};
    const next = vi.fn();

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect(next.mock.calls[0][0].message).toBe('Please authenticate.');
  });

  it('should call next with unauthorized error if user is not found', async () => {
    const req = {
      headers: {
        authorization: `Bearer ${tokenFixture.userOneAccessToken}`,
      },
    };
    const res = {};
    const next = vi.fn();

    await auth()(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(httpStatus.UNAUTHORIZED);
    expect(next.mock.calls[0][0].message).toBe('Please authenticate.');
  });
});
