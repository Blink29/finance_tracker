import React, { useState } from 'react';
import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { 
  FiHome, FiCreditCard, FiPieChart, FiBarChart2, 
  FiUser, FiLogOut, FiBell, FiMenu, FiX
} from 'react-icons/fi';

const MainLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const { user } = useSelector((state) => state.auth);
  const { notifications } = useSelector((state) => state.notifications);
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];
  
  const navigation = [
    { name: 'Dashboard', icon: FiHome, href: '/' },
    { name: 'Transactions', icon: FiCreditCard, href: '/transactions' },
    { name: 'Budgets', icon: FiPieChart, href: '/budgets' },
    { name: 'Reports', icon: FiBarChart2, href: '/reports' },
    { name: 'Profile', icon: FiUser, href: '/profile' },
  ];

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white md:relative md:translate-x-0 transition duration-200 ease-in-out ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-screen">
          <div className="flex items-center justify-between px-4 py-6 border-b">
            <h1 className="text-xl font-bold text-blue-600">Finance Tracker</h1>
            <button
              className="p-1 rounded-md md:hidden"
              onClick={toggleSidebar}
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-grow px-4 py-6 overflow-y-auto">
            <nav className="space-y-1">
              {navigation.map((item) => {
                const isCurrent = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${
                      isCurrent
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isCurrent ? 'text-blue-500' : 'text-gray-500'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="px-4 py-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            >
              <FiLogOut className="mr-3 h-5 w-5 text-gray-500" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Top header */}
        <header className="z-10 sticky top-0 bg-white shadow">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center">
              <button
                className="p-1 rounded-md md:hidden"
                onClick={toggleSidebar}
              >
                <FiMenu className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center">
              <div className="relative">
                <Link to="/profile" className="relative p-1 text-gray-700 rounded-full hover:bg-gray-100">
                  <FiBell className="w-6 h-6" />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs text-center">
                      {unreadNotifications.length}
                    </span>
                  )}
                </Link>
              </div>

              <div className="ml-4 relative">
                <Link to="/profile" className="flex items-center space-x-2 text-sm text-gray-700 hover:text-blue-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-medium text-blue-600">
                      {user.firstName?.charAt(0) || ''}
                      {user.lastName?.charAt(0) || ''}
                    </span>
                  </div>
                  <span className="hidden md:inline-block font-medium">
                    {user.firstName} {user.lastName}
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;