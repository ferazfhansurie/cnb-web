'use client';

import { useState, useEffect } from 'react';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '@/lib/firebase';
import type { Category } from '@/types';
import toast from 'react-hot-toast';
import { PlusIcon, MinusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import DebugInfo from '@/components/DebugInfo';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const fetchedCategories = await getAllCategories();
      const categoriesWithSub = fetchedCategories.map(cat => ({
        ...cat,
        subCategories: cat.subCategories || []
      }));
      setCategories(categoriesWithSub);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!newCategoryName.trim()) {
        toast.error('Category name cannot be empty');
        return;
      }

      if (selectedParentId) {
        // Find if this is a main category or subcategory
        const mainCategory = categories.find(cat => cat.id === selectedParentId);
        if (mainCategory) {
          // Adding to main category
          const newSubCategory = {
            id: Date.now().toString(),
            name: newCategoryName.trim(),
            subCategories: []
          };
          
          await updateCategory(selectedParentId, {
            subCategories: [...(mainCategory.subCategories || []), newSubCategory]
          });
        } else {
          // Find the parent category and subcategory
          for (const category of categories) {
            const parentSubCategory = category.subCategories?.find(sub => sub.id === selectedParentId);
            if (parentSubCategory) {
              const newSubSubCategory = {
                id: Date.now().toString(),
                name: newCategoryName.trim()
              };

              const updatedSubCategories = category.subCategories.map(sub => {
                if (sub.id === selectedParentId) {
                  return {
                    ...sub,
                    subCategories: [...(sub.subCategories || []), newSubSubCategory]
                  };
                }
                return sub;
              });

              await updateCategory(category.id, {
                subCategories: updatedSubCategories
              });
              break;
            }
          }
        }
      } else {
        // Create main category
        await createCategory(newCategoryName.trim());
      }

      setNewCategoryName('');
      setSelectedParentId(null);
      toast.success('Category created successfully');
      loadCategories();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteCategory(categoryId);
        toast.success('Category deleted successfully');
        loadCategories();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleDeleteSubcategory = async (categoryId: string, subcategoryId: string) => {
    if (window.confirm('Are you sure you want to delete this subcategory?')) {
      try {
        const category = categories.find(cat => cat.id === categoryId);
        if (category) {
          const isDirectSubcategory = category.subCategories.some(sub => sub.id === subcategoryId);
          
          if (isDirectSubcategory) {
            const updatedSubCategories = category.subCategories.filter(
              sub => sub.id !== subcategoryId
            );
            await updateCategory(categoryId, { subCategories: updatedSubCategories });
          } else {
            const updatedSubCategories = category.subCategories.map(sub => {
              if (sub.subCategories?.some(subsub => subsub.id === subcategoryId)) {
                return {
                  ...sub,
                  subCategories: sub.subCategories.filter(subsub => subsub.id !== subcategoryId)
                };
              }
              return sub;
            });
            await updateCategory(categoryId, { subCategories: updatedSubCategories });
          }
          toast.success('Subcategory deleted successfully');
          loadCategories();
        }
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderCategories = () => {
    return categories.map(category => {
      const hasSubCategories = category.subCategories?.length > 0;
      const isExpanded = expandedCategories[category.id];

      return (
        <div key={category.id} className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 flex-1">
              {hasSubCategories && (
                <button
                  onClick={() => toggleExpand(category.id)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  {isExpanded ? (
                    <MinusIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  ) : (
                    <PlusIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </button>
              )}
              <span className="font-semibold text-gray-900 dark:text-white">{category.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedParentId(category.id)}
                className="px-3 py-1.5 text-sm font-medium text-white bg-[#FB8A13] rounded-md hover:bg-[#e07911] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FB8A13]"
              >
                Add Sub
              </button>
              <button
                onClick={() => handleDeleteCategory(category.id)}
                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {isExpanded && hasSubCategories && (
            <div className="ml-8 space-y-3">
              {category.subCategories.map(subCategory => {
                const hasSubSubCategories = subCategory.subCategories?.length || 0 > 0;
                const isSubExpanded = expandedCategories[subCategory.id];

                return (
                  <div key={subCategory.id} className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-[#FB8A13] border-l-4 border-t-0 border-r-0 border-b-0 border-l-[#FB8A13]">
                      <div className="flex items-center space-x-3 flex-1">
                        {hasSubSubCategories && (
                          <button
                            onClick={() => toggleExpand(subCategory.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                          >
                            {isSubExpanded ? (
                              <MinusIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            ) : (
                              <PlusIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            )}
                          </button>
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">{subCategory.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedParentId(subCategory.id)}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-[#FB8A13] rounded-md hover:bg-[#e07911] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FB8A13]"
                        >
                          Add Sub
                        </button>
                        <button
                          onClick={() => handleDeleteSubcategory(category.id, subCategory.id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {isSubExpanded && subCategory.subCategories && (
                      <div className="ml-8 space-y-3">
                        {subCategory.subCategories.map(subSubCategory => (
                          <div
                            key={subSubCategory.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-[#FB8A13] border-l-4 border-t-0 border-r-0 border-b-0 border-l-[#FB8A13]"
                          >
                            <span className="text-gray-900 dark:text-white">{subSubCategory.name}</span>
                            <button
                              onClick={() => handleDeleteSubcategory(category.id, subSubCategory.id)}
                              className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });
  };

  const debugData = {
    currentUser: {
      uid: currentUser?.uid,
      email: currentUser?.email,
    },
    totalCategories: categories.length,
    totalSubcategories: categories.reduce((acc, cat) => 
      acc + cat.subCategories.length + 
      cat.subCategories.reduce((subAcc, sub) => 
        subAcc + (sub.subCategories?.length || 0), 0
      ), 0
    ),
    categoriesWithSubcategories: categories.filter(cat => cat.subCategories.length > 0).length,
  };

  const debugSummaryItems = [
    { label: 'Categories', value: debugData.totalCategories },
    { label: 'Subcategories', value: debugData.totalSubcategories },
    { label: 'Parent Categories', value: debugData.categoriesWithSubcategories },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {process.env.NODE_ENV === 'development' && (
        <DebugInfo data={debugData} summaryItems={debugSummaryItems} />
      )}
      
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Manage your product categories and subcategories
          </p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {selectedParentId ? 'Add Subcategory' : 'Add Category'}
          </h2>
          <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base py-2 px-3"
              />
            </div>
            <div className="flex items-center gap-4">
              {selectedParentId && (
                <button
                  type="button"
                  onClick={() => setSelectedParentId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FB8A13]"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center rounded-md border border-transparent bg-[#FB8A13] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#e07911] focus:outline-none focus:ring-2 focus:ring-[#FB8A13] focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          {renderCategories()}
        </div>
      </div>
    </div>
  );
} 