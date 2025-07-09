const path = require('path');

module.exports = {
  development: {
    type: 'sqlite',
    database: path.resolve(__dirname, '../../db/amr.db'),
    logging: true
  },
  production: {
    type: 'sqlite',
    database: path.resolve(__dirname, '../../db/amr.db'),
    logging: false
  }
}; 