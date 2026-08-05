require('dotenv').config();

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'shopkart_dev_secret_change_me_in_production',
  PORT: process.env.PORT || 3000
};
