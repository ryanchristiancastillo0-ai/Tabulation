const REFRESH_TOKEN_TTL_DAYS = Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7;

module.exports = {
  JWT_SECRET:           process.env.JWT_SECRET  || 'change_this_secret',
  JWT_EXPIRES:          process.env.JWT_EXPIRES || '7d',
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || '15m',
  REFRESH_TOKEN_TTL_DAYS,
  REFRESH_TOKEN_TTL_MS: REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
};