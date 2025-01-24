'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ShoppingBagIcon, 
  TagIcon, 
  GiftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusCircleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    promotions: 0,
    activePromotions: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [products, categories, promotions] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'promotions')),
        ]);

        const activePromos = promotions.docs.filter(doc => {
          const data = doc.data();
          const endDate = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate);
          const startDate = data.startDate?.toDate ? data.startDate.toDate() : new Date(data.startDate);
          const now = new Date();
          return data.active && startDate <= now && endDate >= now;
        });

        setStats({
          products: products.size,
          categories: categories.size,
          promotions: promotions.size,
          activePromotions: activePromos.length,
        });

        // Fetch recent activity
        const recentProductsQuery = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(5));
        const recentPromotionsQuery = query(collection(db, 'promotions'), orderBy('createdAt', 'desc'), limit(5));
        
        const [recentProducts, recentPromotions] = await Promise.all([
          getDocs(recentProductsQuery),
          getDocs(recentPromotionsQuery),
        ]);

        const activity = [
          ...recentProducts.docs.map(doc => ({
            id: doc.id,
            type: 'product',
            name: doc.data().name,
            date: doc.data().createdAt?.toDate() || new Date(),
          })),
          ...recentPromotions.docs.map(doc => ({
            id: doc.id,
            type: 'promotion',
            name: doc.data().name,
            date: doc.data().createdAt?.toDate() || new Date(),
          })),
        ].sort((a, b) => b.date - a.date).slice(0, 5);

        setRecentActivity(activity);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const quickActions = [
    { name: 'Add Product', href: '/admin/products', icon: ShoppingBagIcon },
    { name: 'Add Category', href: '/admin/categories', icon: TagIcon },
    { name: 'Create Promotion', href: '/admin/promotions', icon: GiftIcon },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Overview of your store's performance and recent activity
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Products Stats */}
        <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:px-6 sm:pt-6">
          <dt>
            <div className="absolute rounded-md bg-indigo-500 p-3">
              <ShoppingBagIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Products</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.products}</p>
            <div className="ml-2">
              <ArrowUpIcon className="h-4 w-4 text-green-500" aria-hidden="true" />
            </div>
          </dd>
        </div>

        {/* Categories Stats */}
        <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:px-6 sm:pt-6">
          <dt>
            <div className="absolute rounded-md bg-green-500 p-3">
              <TagIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">Categories</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.categories}</p>
          </dd>
        </div>

        {/* Total Promotions Stats */}
        <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:px-6 sm:pt-6">
          <dt>
            <div className="absolute rounded-md bg-purple-500 p-3">
              <GiftIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">Total Promotions</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.promotions}</p>
          </dd>
        </div>

        {/* Active Promotions Stats */}
        <div className="relative overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 py-5 shadow sm:px-6 sm:pt-6">
          <dt>
            <div className="absolute rounded-md bg-yellow-500 p-3">
              <ChartBarIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <p className="ml-16 truncate text-sm font-medium text-gray-500 dark:text-gray-400">Active Promotions</p>
          </dt>
          <dd className="ml-16 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.activePromotions}</p>
          </dd>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link
              key={action.name}
              href={action.href}
              className="relative flex items-center space-x-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-5 shadow-sm hover:border-gray-400 dark:hover:border-gray-600"
            >
              <div className="flex-shrink-0">
                <action.icon className="h-6 w-6 text-gray-600 dark:text-gray-400" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">{action.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h2>
        <div className="mt-4 overflow-hidden rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 shadow">
          <ul role="list" className="divide-y divide-gray-300 dark:divide-gray-700">
            {loading ? (
              <li className="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</li>
            ) : recentActivity.length === 0 ? (
              <li className="p-4 text-center text-gray-500 dark:text-gray-400">No recent activity</li>
            ) : (
              recentActivity.map((item) => (
                <li key={item.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {item.type === 'product' ? (
                        <ShoppingBagIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      ) : (
                        <GiftIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                      )}
                      <p className="ml-2 truncate text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </p>
                    </div>
                    <div className="ml-2 flex flex-shrink-0">
                      <span className="inline-flex text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.date).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      New {item.type} added
                    </p>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
} 