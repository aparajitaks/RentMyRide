// Lightweight auth shim for tests: maps x-user-id header to req.user
export function testAuthShim(req, _res, next) {
  const uid = req.header("x-user-id");
  if (uid) {
    req.user = { id: uid };
  }
  next();
}
