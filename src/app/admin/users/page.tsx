'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, deleteUser, UserRole, updateUser } from '@/lib/firebase';
import type { UserData } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';
import DebugInfo from '@/components/DebugInfo';

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });
  const { user: currentUser } = useAuth();

  // Add a new state for debug info expansion
  const [isDebugExpanded, setIsDebugExpanded] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    name: '',
    email: '',
  });

  const roles: UserRole[] = ['Admin', 'Manager', 'User - Price', 'User - No Price', 'Pending'];

  useEffect(() => {
    console.log('Current User State:', {
      currentUser,
      email: currentUser?.email,
      uid: currentUser?.uid
    });
    
    if (!currentUser) {
      console.log('❌ No user data found');
      return;
    }

    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      console.log('🚀 Loading users...');
      setLoading(true);
      const allUsers = await getAllUsers();
      console.log('📋 All users:', allUsers);
      
      // Get current user's full data
      const currentUserData = allUsers.find(u => u.uid === currentUser?.uid);
      console.log('🎯 Current user data:', currentUserData);
      
      if (!currentUserData) {
        console.warn('⚠️ Current user data not found in users list');
      }

      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error: any) {
      console.error('💥 Error fetching users:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = users.filter(user => 
      user.name?.toLowerCase().includes(query.toLowerCase()) ||
      user.email?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }

    setSortConfig({ key, direction });

    if (direction === null) {
      setFilteredUsers([...users].filter(user => 
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      return;
    }

    const sortedUsers = [...filteredUsers].sort((a, b) => {
      if (key === 'name') {
        return direction === 'asc'
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      }
      if (key === 'email') {
        return direction === 'asc'
          ? (a.email || '').localeCompare(b.email || '')
          : (b.email || '').localeCompare(a.email || '');
      }
      if (key === 'role') {
        return direction === 'asc'
          ? (a.role || '').localeCompare(b.role || '')
          : (b.role || '').localeCompare(a.role || '');
      }
      return 0;
    });

    setFilteredUsers(sortedUsers);
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key === key) {
      if (sortConfig.direction === 'asc') {
        return '↑';
      } else if (sortConfig.direction === 'desc') {
        return '↓';
      }
    }
    return '↕';
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      if (!currentUser) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      // Get the current user's data from the users list
      const currentUserData = users.find(u => u.uid === currentUser.uid);
      
      if (!currentUserData || currentUserData.role !== 'Admin') {
        toast.error('Only administrators can modify user roles');
        return;
      }

      const targetUser = users.find(user => user.uid === userId);
      if (!targetUser) {
        toast.error('User not found');
        return;
      }

      if (userId === currentUser.uid && newRole !== 'Admin') {
        const confirmed = window.confirm(
          'You are about to remove your own admin privileges. This action will remove your ability to manage users and other administrative functions. Are you sure?'
        );

        if (!confirmed) {
          return;
        }
      }

      await updateUserRole(userId, newRole);
      await loadUsers();
      setIsRoleModalOpen(false);
      toast.success('User role updated successfully');

    } catch (error: any) {
      console.error('Role update error:', error);
      toast.error(error.message);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    try {
      if (!currentUser) {
        toast.error('You must be logged in to perform this action');
        return;
      }

      // Get the current user's data from the users list
      const currentUserData = users.find(u => u.uid === currentUser.uid);
      
      if (!currentUserData || currentUserData.role !== 'Admin') {
        toast.error('Only administrators can delete users');
        return;
      }

      // Prevent admin from deleting themselves
      if (userId === currentUser.uid) {
        toast.error('You cannot delete your own account');
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to delete the user ${userEmail}? This action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      await deleteUser(userId);
      await loadUsers();
      toast.success('User deleted successfully');

    } catch (error: any) {
      console.error('Delete user error:', error);
      toast.error(error.message);
    }
  };

  const handleEditProfile = () => {
    const currentUserData = users.find(u => u.uid === currentUser?.uid);
    setEditedProfile({
      name: currentUserData?.name || '',
      email: currentUserData?.email || '',
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!currentUser?.uid) return;

      await updateUser(currentUser.uid, {
        name: editedProfile.name,
        email: editedProfile.email,
      });

      await loadUsers();
      setIsEditingProfile(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message);
    }
  };

  // Remove the local DebugInfo component implementation and just prepare the data
  const debugData = {
    currentUser: {
      uid: currentUser?.uid,
      email: currentUser?.email,
    },
    currentUserRole: users.find(u => u.uid === currentUser?.uid)?.role || 'N/A',
    totalUsers: users.length,
    filteredUsers: filteredUsers.length,
  };

  const debugSummaryItems = [
    { label: 'Role', value: debugData.currentUserRole },
    { label: 'Total Users', value: debugData.totalUsers },
    { label: 'Filtered', value: debugData.filteredUsers },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {process.env.NODE_ENV === 'development' && (
        <DebugInfo data={debugData} summaryItems={debugSummaryItems} />
      )}
      
      {/* Current User Profile Section */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex items-center space-x-6">
          <div className="flex-shrink-0">
            {currentUser ? (
              <div className="h-24 w-24 rounded-full bg-[#FB8A13] flex items-center justify-center">
                <UserIcon className="h-12 w-12 text-white" aria-hidden="true" />
              </div>
            ) : (
              <div className="h-24 w-24 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {users.find(u => u.uid === currentUser?.uid)?.name || currentUser?.email || 'Loading...'}
                </h2>
                {users.find(u => u.uid === currentUser?.uid)?.role && (
                  <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    users.find(u => u.uid === currentUser?.uid)?.role === 'Admin'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : users.find(u => u.uid === currentUser?.uid)?.role === 'Manager'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {users.find(u => u.uid === currentUser?.uid)?.role}
                  </span>
                )}
              </div>
              <button
                onClick={handleEditProfile}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            </div>
            {!isEditingProfile ? (
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{currentUser?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Status</p>
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">Active</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Login</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentUser?.metadata?.lastSignInTime ? new Date(currentUser.metadata.lastSignInTime).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Member Since</p>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={editedProfile.name}
                    onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={editedProfile.email}
                    onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FB8A13]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#FB8A13] border border-transparent rounded-md hover:bg-[#e07911] focus:outline-none focus:ring-2 focus:ring-[#FB8A13]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Users Management Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users Management</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Manage user roles and permissions
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="Search users by name or email"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Users List */}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th 
                      scope="col" 
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Name {getSortIcon('name')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-1">
                        Email {getSortIcon('email')}
                      </div>
                    </th>
                    {/* <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Company
                    </th> */}
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('role')}
                    >
                      <div className="flex items-center gap-1">
                        Role {getSortIcon('role')}
                      </div>
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-500 dark:text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.uid}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 dark:text-white sm:pl-6">
                          {user.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </td>
                        {/* <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {user.companyName}
                        </td> */}
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              user.role === 'Admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                : user.role === 'Manager'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                : user.role === 'User - Price'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : user.role === 'User - No Price'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                : user.role === 'Pending'
                                ? 'bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-200'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <div className="flex justify-end gap-4 items-center">
                            {(() => {
                              const currentUserRole = users.find(u => u.uid === currentUser?.uid)?.role;
                              const canDelete = currentUserRole === 'Admin' && user.uid !== currentUser?.uid;
                              
                              if (process.env.NODE_ENV === 'development') {
                                console.log('Delete button conditions:', {
                                  currentUserRole,
                                  userUid: user.uid,
                                  currentUserUid: currentUser?.uid,
                                  canDelete
                                });
                              }

                              return (
                                <div className="flex items-center gap-4">
                                  {canDelete && (
                                    <button
                                      onClick={() => handleDeleteUser(user.uid, user.email)}
                                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                      title="Delete user"
                                    >
                                      <TrashIcon className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setIsRoleModalOpen(true);
                                    }}
                                    className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                  >
                                    Change Role
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Role Change Modal */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity">
          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <UserIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                      Change Role for {selectedUser.name}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select a new role for this user. This will change their permissions in the system.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 space-y-2">
                  {roles.map((role) => (
                    <button
                      key={role}
                      onClick={() => handleUpdateRole(selectedUser.uid, role)}
                      className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ${
                        selectedUser.role === role
                          ? 'bg-[#FB8A13] text-white hover:bg-[#e07911]'
                          : 'bg-white text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-white dark:ring-gray-600 dark:hover:bg-gray-600'
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                    onClick={() => setIsRoleModalOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 