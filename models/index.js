const sequelize = require('../db');

(async () => {
  await sequelize.sync({ force: false });
})();

module.exports = {
  user: require('./user'),
  har: require('./har')
};
