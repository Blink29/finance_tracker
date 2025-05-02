# Finance Tracker Application

A comprehensive financial tracking web application that allows users to track income, expenses, and manage budgets. Built with Node.js, Express, React, Redux, and PostgreSQL.

## Features

- **User Authentication**: Register, login, and profile management with JWT authentication
- **Google OAuth**: Social login with Google
- **Transaction Management**: Add, edit, and delete income and expense transactions
- **Budgeting**: Set budget goals for different expense categories and track progress
- **Receipt Management**: Upload and store receipts for transactions
- **Dashboard**: Overview of financial status with graphical representations
- **Reporting**: Generate detailed financial reports
- **Notification System**: Get alerts about budget overruns 
- **Email Notifications**: **Emails may have gone to spam folder, please check there too**

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- Passport.js for Google OAuth
- Multer for file uploads

### Frontend
- React
- Redux with Redux Toolkit
- React Router
- Tailwind CSS
- Vite

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation and Setup

1. **Clone the repository**:
```
git clone <repository-url>
cd FJ-BE-R2-Paurush_Kumar-IITM
```

2. **Install backend dependencies**:
```
npm install
```

3. **Install frontend dependencies**:
```
cd frontend
npm install
cd ..
```

4. **Set up environment variables**:
   
   The .env file should exist in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development
DB_NAME=finance_tracker
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=noreply@financetracker.com
FRONTEND_URL=your_frontend_url
```

5. **Create the PostgreSQL database**:
```
createdb finance_tracker
```

6. **Create upload directories**:
```
mkdir -p public/uploads/profiles
```

7. **Initialize the database**:
```
node src/utils/db-init.js
```

8. **Start the backend server**:
```
npm run dev
```

9. **Start the frontend development server**:
```
cd frontend
npm run dev
```

10. **Access the application**:
   
   Open your browser and navigate to https://fj-be-r2-paurush-kumar-iitm.vercel.app (or the URL displayed in the terminal)

## Project Structure

```
├── frontend/              # React frontend code
│   ├── src/
│   │   ├── assets/        # Static assets
│   │   ├── components/    # Reusable UI components
│   │   ├── layouts/       # Page layouts
│   │   ├── pages/         # Application pages
│   │   ├── redux/         # Redux state management
│   │   │   ├── slices/    # Redux Toolkit slices
│   │   │   └── store.js   # Redux store configuration
│   │   └── services/      # API service functions
│   └── package.json       # Frontend dependencies
│
├── public/                # Public assets
│   └── uploads/           # User-uploaded files
│       └── profiles/      # Profile pictures
│
├── src/                   # Backend code
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # Sequelize models
│   ├── routes/            # Express routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── server.js          # Express app entry point
│
├── .env                   # Environment variables
├── package.json           # Backend dependencies
└── README.md              # Project documentation
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user profile

### Transactions
- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/:id` - Get a single transaction
- `POST /api/transactions` - Create a transaction (with optional receipt upload)
- `PUT /api/transactions/:id` - Update a transaction
- `DELETE /api/transactions/:id` - Delete a transaction
- `GET /api/transactions/summary` - Get transactions summary for dashboard

### Budgets
- `GET /api/budgets` - Get all budgets
- `GET /api/budgets/:id` - Get a single budget
- `POST /api/budgets` - Create a budget
- `PUT /api/budgets/:id` - Update a budget
- `DELETE /api/budgets/:id` - Delete a budget
- `GET /api/budgets/:id/progress` - Track budget progress

### Reports
- `GET /api/reports/monthly` - Get monthly income vs expense report
- `GET /api/reports/category` - Get spending breakdown by category
- `GET /api/reports/cashflow` - Get cash flow report

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `PUT /api/profile/picture` - Update profile picture
- `PUT /api/profile/password` - Change password
- `GET /api/profile/notifications` - Get user notifications

## Development

To run the application in development mode with hot reloading:

```
# Run backend with nodemon (if installed)
npx nodemon src/server.js

# Run frontend with Vite dev server
cd frontend
npm run dev
```

## Production Deployment

For production deployment:

1. Build the frontend:
```
cd frontend
npm run build
```

2. Set NODE_ENV to production in .env file:
```
NODE_ENV=production
```

3. Start the server:
```
npm start
```

## License

This project is licensed under the MIT License.