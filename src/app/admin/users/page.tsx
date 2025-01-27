'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, UserRole } from '@/lib/firebase';
import type { UserData } from '@/types';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { UserIcon } from '@heroicons/react/24/outline';
import { ChevronUpDownIcon } from '@heroicons/react/24/outline';

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

  const roles: UserRole[] = ['Admin', 'Manager', 'User - Price', 'User - No Price', 'Pending'];

  useEffect(() => {
    if (!currentUser) {
      console.log('No user data found');
      return;
    }

    loadUsers();
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
    } catch (error: any) {
      console.error('Error fetching users:', error);
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

  return (
    <div className="p-4 sm:p-6 lg:p-8">
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
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setIsRoleModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            Change Role
                          </button>
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