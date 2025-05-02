const sequelize = require('../config/database');
const { User, Transaction, Budget, Notification } = require('../models');

const initializeDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync all models with database
    await sequelize.sync({ alter: true });
    console.log('All models synchronized with database.');
    
    // Check if admin user exists, create one if not
    const adminEmail = 'admin@example.com';
    const existingAdmin = await User.findOne({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      console.log('Creating admin user...');
      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: adminEmail,
        password: 'password123', // This will be hashed by the model hooks
        isEmailVerified: true
      });
      console.log('Admin user created successfully.');
    }
    
    console.log('Database initialization completed.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

// Run if script is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;