const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('budget_overrun', 'system', 'reminder'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  relatedEntityId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'Optional ID reference to related entity like budget or transaction'
  },
  relatedEntityType: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Notification;