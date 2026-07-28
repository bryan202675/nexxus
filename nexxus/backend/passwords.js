const crypto = require("crypto");

const INTERNAL_PASSWORD_ALGORITHM = "pbkdf2_sha256";
const INTERNAL_PASSWORD_ITERATIONS = 210000;

const hashInternalPassword = (password) => {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto
    .pbkdf2Sync(password, salt, INTERNAL_PASSWORD_ITERATIONS, 32, "sha256")
    .toString("base64");
  return `${INTERNAL_PASSWORD_ALGORITHM}$${INTERNAL_PASSWORD_ITERATIONS}$${salt}$${hash}`;
};

const verifyInternalPassword = (password, storedHash) => {
  const [algorithm, iterationsValue, salt, expectedHash] = String(storedHash || "").split("$");
  if (algorithm !== INTERNAL_PASSWORD_ALGORITHM || !salt || !expectedHash) return false;
  const iterations = Number(iterationsValue);
  if (!Number.isInteger(iterations) || iterations < 100000) return false;
  const actual = crypto.pbkdf2Sync(password, salt, iterations, 32, "sha256");
  const expected = Buffer.from(expectedHash, "base64");
  return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
};

module.exports = {
  INTERNAL_PASSWORD_ALGORITHM,
  INTERNAL_PASSWORD_ITERATIONS,
  hashInternalPassword,
  verifyInternalPassword,
};
