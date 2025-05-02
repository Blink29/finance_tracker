import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Provider, useDispatch } from "react-redux";
import { store } from "./redux/store";
import { setUser } from "./redux/slices/authSlice";

// Layouts
import MainLayout from "./layouts/MainLayout";
import AuthLayout from "./layouts/AuthLayout";

// Pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Transactions from "./pages/Transactions";
import TransactionForm from "./pages/TransactionForm";
import Budgets from "./pages/Budgets";
import BudgetForm from "./pages/BudgetForm";
import BudgetDetails from "./pages/BudgetDetails";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

// OAuth Auth Handler Component
const AuthHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  
  useEffect(() => {
    // Check if we have auth data in the URL
    const query = new URLSearchParams(location.search);
    const authData = query.get('auth');
    const error = query.get('error');
    
    if (authData) {
      try {
        // Parse the auth data
        const auth = JSON.parse(decodeURIComponent(authData));
        
        // Store user in localStorage
        localStorage.setItem('user', JSON.stringify(auth));
        
        // Dispatch user data to Redux store
        dispatch(setUser(auth));
        
        // Remove the auth data from URL
        navigate('/', { replace: true });
        
        toast.success('Successfully signed in with Google!');
      } catch (error) {
        console.error('Error parsing auth data:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login', { replace: true });
      }
    }
    
    if (error) {
      toast.error(error);
      navigate('/login', { replace: true });
    }
  }, [location, navigate, dispatch]);
  
  return null;
};

function AppContent() {
  return (
    <>
      <AuthHandler />
      <Routes>
        {/* Auth routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Main app routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/add" element={<TransactionForm />} />
          <Route path="/transactions/:id" element={<TransactionForm />} />
          <Route
            path="/transactions/edit/:id"
            element={<TransactionForm />}
          />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/budgets/add" element={<BudgetForm />} />
          <Route path="/budgets/edit/:id" element={<BudgetForm />} />
          <Route path="/budgets/:id" element={<BudgetDetails />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer />
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <AppContent />
        </div>
      </Router>
    </Provider>
  );
}

export default App;