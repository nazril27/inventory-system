export function remainingMs(expires) {
  const expiresInMs = Date.parse(expires);
  const now = Date.now();

  return expiresInMs - now;
}