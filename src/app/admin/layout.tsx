'use client';

import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import {
  HomeIcon,
  TagIcon,
  ShoppingBagIcon,
  GiftIcon,
  ArrowLeftOnRectangleIcon,
  SunIcon,
  MoonIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
  { name: 'Categories', href: '/admin/categories', icon: TagIcon },
  { name: 'Promotions', href: '/admin/promotions', icon: GiftIcon },
  { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-right" />
      
      {/* Mobile menu button and header */}
      <div className="sticky top-0 z-40 flex h-16 flex-shrink-0 bg-white dark:bg-gray-900 shadow-sm lg:hidden">
        <button
          type="button"
          className="px-4 text-gray-500 dark:text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#FB8A13] lg:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span className="sr-only">Open sidebar</span>
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
        <div className="flex flex-1 justify-between px-4">
          <div className="flex items-center">
            <Image
              src="/cnb-web.png"
              alt="CNB Logo"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <h1 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">CNB Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" aria-hidden="true" />
              ) : (
                <MoonIcon className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-[calc(100vh-4rem)] lg:min-h-screen">
        {/* Mobile menu */}
        <div
          className={`fixed inset-0 z-50 lg:hidden ${
            isMobileMenuOpen ? 'block' : 'hidden'
          }`}
        >
          {/* Backdrop */}
          <div
            className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
              isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile menu content */}
          <div
            className={`fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 ease-in-out transform ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex items-center justify-between px-4">
                <div className="flex items-center">
                  <Image
                    src="/cnb-web.png"
                    alt="CNB Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                    priority
                  />
                  <h1 className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">CNB Admin</h1>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                </button>
              </div>
              <nav className="mt-8 flex-1 space-y-1 px-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`${
                        isActive
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      } group flex items-center rounded-md px-3 py-2.5 text-base font-medium transition-colors`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-gray-500 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        } mr-4 h-5 w-5 flex-shrink-0 transition-colors`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-start rounded-md px-3 py-2.5 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 text-red-500" aria-hidden="true" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64">
          <div className="flex flex-grow flex-col overflow-y-auto border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4 justify-between">
              <div className="flex items-center">
                <Image
                  src="/cnb-web.png"
                  alt="CNB Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                  priority
                />
                <h1 className="ml-3 text-xl font-bold text-gray-900 dark:text-white">CNB Admin</h1>
              </div>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <MoonIcon className="h-5 w-5" aria-hidden="true" />
                )}
              </button>
            </div>
            <div className="mt-8 flex flex-grow flex-col">
              <nav className="flex-1 space-y-2 px-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      } group flex items-center rounded-md px-3 py-2.5 text-base font-medium transition-colors`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-gray-500 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        } mr-4 h-5 w-5 flex-shrink-0 transition-colors`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-800 p-4">
              <button
                onClick={handleLogout}
                className="flex w-full items-center justify-start rounded-md px-3 py-2.5 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3 text-red-500" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col lg:pl-64">
          <main className="flex-1 bg-gray-50 dark:bg-gray-900">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 