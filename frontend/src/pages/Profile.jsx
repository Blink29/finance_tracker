import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiEdit, FiCheck, FiBell } from 'react-icons/fi';
import { getCurrentUser } from '../redux/slices/authSlice';
import axios from 'axios';

const Profile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notifications } = useSelector((state) => state.notifications || { notifications: [] });

  // Extract user details and token from the user object
  const userDetails = user?.user || {};
  const userToken = user?.token;

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profilePicture, setProfilePicture] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  useEffect(() => {
    if (userDetails) {
      setProfileData({
        firstName: userDetails.firstName || '',
        lastName: userDetails.lastName || '',
        email: userDetails.email || '',
      });

      if (userDetails.profilePicture) {
        setPreviewUrl(`https://fj-be-r2-paurush-kumar-iitm.onrender.com${userDetails.profilePicture}`);
      }
    }
  }, [userDetails]);

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = userToken;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(
        'https://fj-be-r2-paurush-kumar-iitm.onrender.com/api/profile',
        profileData,
        config
      );

      toast.success('Profile updated successfully');
      setIsEditing(false);
      dispatch(getCurrentUser());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const token = userToken;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const response = await axios.put(
        'https://fj-be-r2-paurush-kumar-iitm.onrender.com/api/profile/password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        config
      );

      toast.success('Password updated successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfilePictureSubmit = async (e) => {
    e.preventDefault();
    
    if (!profilePicture) {
      return;
    }

    setIsLoading(true);

    try {
      const token = userToken;
      const formData = new FormData();
      formData.append('profilePicture', profilePicture);

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      };

      const response = await axios.put(
        'https://fj-be-r2-paurush-kumar-iitm.onrender.com/api/profile/picture',
        formData,
        config
      );

      toast.success('Profile picture updated successfully');
      dispatch(getCurrentUser());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating profile picture');
    } finally {
      setIsLoading(false);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const token = userToken;
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      await axios.put(
        `https://fj-be-r2-paurush-kumar-iitm.onrender.com/api/profile/notifications/${id}/read`,
        {},
        config
      );

      dispatch(getCurrentUser());
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error marking notification as read');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Profile</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="flex border-b">
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'profile' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser className="inline-block mr-2" />
            Profile Information
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'security' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('security')}
          >
            <FiLock className="inline-block mr-2" />
            Security
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm focus:outline-none ${
              activeTab === 'notifications' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('notifications')}
          >
            <FiBell className="inline-block mr-2" />
            Notifications
          </button>
        </div>

        <div className="p-6">
          {/* Profile Information */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Profile Picture Section */}
              <div>
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-blue-100 flex items-center justify-center text-blue-500 text-3xl font-bold border-4 border-gray-200">
                        {userDetails?.firstName?.charAt(0) || ''}{userDetails?.lastName?.charAt(0) || ''}
                      </div>
                    )}

                    <label
                      htmlFor="profile-picture"
                      className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-gray-300 cursor-pointer"
                    >
                      <FiEdit className="h-5 w-5 text-gray-500" />
                      <input
                        id="profile-picture"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfilePictureChange}
                      />
                    </label>
                  </div>

                  {profilePicture && (
                    <button
                      type="button"
                      onClick={handleProfilePictureSubmit}
                      disabled={isLoading}
                      className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                      {isLoading ? 'Saving...' : 'Save Picture'}
                    </button>
                  )}

                  <h2 className="mt-4 text-xl font-medium text-gray-900">
                    {userDetails?.firstName} {userDetails?.lastName}
                  </h2>
                  <p className="text-gray-500">{userDetails?.email}</p>
                </div>
              </div>

              {/* Profile Details Section */}
              <div className="lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Profile Details</h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(!isEditing)}
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    {isEditing ? (
                      <>
                        <FiCheck className="mr-1 -ml-0.5 h-4 w-4" /> Save
                      </>
                    ) : (
                      <>
                        <FiEdit className="mr-1 -ml-0.5 h-4 w-4" /> Edit
                      </>
                    )}
                  </button>
                </div>

                <form onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        id="firstName"
                        value={profileData.firstName}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        className={`mt-1 block w-full rounded-md ${
                          isEditing
                            ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            : 'border-transparent bg-gray-100'
                        } shadow-sm sm:text-sm`}
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        id="lastName"
                        value={profileData.lastName}
                        onChange={handleProfileChange}
                        disabled={!isEditing}
                        className={`mt-1 block w-full rounded-md ${
                          isEditing
                            ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            : 'border-transparent bg-gray-100'
                        } shadow-sm sm:text-sm`}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled={!isEditing}
                      className={`mt-1 block w-full rounded-md ${
                        isEditing
                          ? 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                          : 'border-transparent bg-gray-100'
                      } shadow-sm sm:text-sm`}
                    />
                  </div>

                  {isEditing && (
                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                      >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          if (userDetails) {
                            setProfileData({
                              firstName: userDetails.firstName || '',
                              lastName: userDetails.lastName || '',
                              email: userDetails.email || '',
                            });
                          }
                        }}
                        className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}

          {/* Security Tab (Password Change) */}
          {activeTab === 'security' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              <form onSubmit={handlePasswordSubmit} className="max-w-md">
                <div className="mb-4">
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    id="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    id="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                </div>

                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    id="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                >
                  {isLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>

              {notifications && notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border ${
                        notification.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex justify-between">
                        <div>
                          <p className="text-sm text-gray-900 font-medium">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <button
                            onClick={() => markNotificationAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiBell className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any notifications at the moment.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;