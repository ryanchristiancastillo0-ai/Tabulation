module.exports = {
  JWT_SECRET:  process.env.JWT_SECRET  || 'change_this_secret',
  JWT_EXPIRES: process.env.JWT_EXPIRES || '8h',
};