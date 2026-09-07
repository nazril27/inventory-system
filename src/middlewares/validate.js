import { z } from 'zod';
import { pick } from '../utils/pick.js';

const validate = (schema) => (req, _res, next) => {
  const validSchema = pick(schema, ['body', 'query', 'params']);
  const object = pick(req, Object.keys(validSchema));

  const parsed = z.object(validSchema).safeParse(object);

  if (!parsed.success) {
    return next(parsed.error);
  }

  if (parsed.data.body) {
    req.body = parsed.data.body;
  }

  if (parsed.data.params) {
    req.params = parsed.data.params;
  }

  if (parsed.data.query) {
    for (const key in req.query) {
      delete req.query[key];
    }
    Object.assign(req.query, parsed.data.query);
  }

  return next();
};

export { validate };
