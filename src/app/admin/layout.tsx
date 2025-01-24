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
} from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { useTheme } from '@/contexts/ThemeContext';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Products', href: '/admin/products', icon: ShoppingBagIcon },
  { name: 'Categories', href: '/admin/categories', icon: TagIcon },
  { name: 'Promotions', href: '/admin/promotions', icon: GiftIcon },
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Toaster position="top-right" />
      <div className="flex min-h-screen">
        {/* Sidebar */}
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
              <nav className="flex-1 space-y-1 px-2">
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
                      } group flex items-center rounded-md px-2 py-2 text-base font-medium`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-gray-500 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300'
                        } mr-4 h-6 w-6 flex-shrink-0`}
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
                className="flex w-full items-center justify-start rounded-md px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2 text-red-500" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 flex-col lg:pl-64">
          <main className="flex-1 bg-gray-50 dark:bg-gray-900">
            <div className="py-6">
              <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
} 