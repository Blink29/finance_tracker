const User = require('./user.model');
const Transaction = require('./transaction.model');
const Budget = require('./budget.model');
const Notification = require('./notification.model');

// Define relationships
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Budget, { foreignKey: 'userId', as: 'budgets' });
Budget.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  User,
  Transaction,
  Budget,
  Notification
};