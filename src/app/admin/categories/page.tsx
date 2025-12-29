'use client';

import { useState, useEffect } from 'react';
import { createCategory, deleteCategory, getAllCategories, updateCategory } from '@/lib/firebase';
import type { Category } from '@/types';
import toast from 'react-hot-toast';
import { PlusIcon, MinusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
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
      // Sort categories by order if it exists, otherwise keep original order
      const sortedCategories = fetchedCategories
        .map((cat, index) => ({
          ...cat,
          order: cat.order ?? index,
          subCategories: (cat.subCategories || [])
            .map((subCat, subIndex) => ({
              ...subCat,
              order: subCat.order ?? subIndex,
              subCategories: (subCat.subCategories || [])
                .map((subSubCat, subSubIndex) => ({
                  ...subSubCat,
                  order: subSubCat.order ?? subSubIndex
                }))
                .sort((a, b) => (a.order || 0) - (b.order || 0))
            }))
            .sort((a, b) => (a.order || 0) - (b.order || 0))
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      
      setCategories(sortedCategories);
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
          const maxOrder = mainCategory.subCategories.reduce(
            (max, subCat) => Math.max(max, subCat.order || 0), 
            -1
          );
          
          const newSubCategory = {
            id: Date.now().toString(),
            name: newCategoryName.trim(),
            order: maxOrder + 1,
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
              const maxOrder = (parentSubCategory.subCategories || []).reduce(
                (max, subSubCat) => Math.max(max, subSubCat.order || 0), 
                -1
              );
              
              const newSubSubCategory = {
                id: Date.now().toString(),
                name: newCategoryName.trim(),
                order: maxOrder + 1
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
        // Create main category - order is handled in the createCategory function
        await createCategory(newCategoryName.trim());
      }

      setNewCategoryName('');
      setSelectedParentId(null);
      toast.success('Category created successfully');
      await loadCategories(); // Use await to ensure categories are loaded before continuing
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
        
        // Reorder remaining categories to ensure no gaps in order
        const remainingCategories = categories.filter(cat => cat.id !== categoryId);
        const updates = remainingCategories.map((cat, index) => 
          updateCategory(cat.id, { order: index })
        );
        
        await Promise.all(updates);
        toast.success('Category deleted successfully');
        await loadCategories();
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
            // Remove the subcategory
            const updatedSubCategories = category.subCategories.filter(
              sub => sub.id !== subcategoryId
            );
            
            // Reorder remaining subcategories
            const reorderedSubCategories = updatedSubCategories.map((subCat, index) => ({
              ...subCat,
              order: index
            }));
            
            await updateCategory(categoryId, { subCategories: reorderedSubCategories });
          } else {
            // Find which subcategory contains the sub-subcategory to delete
            const updatedSubCategories = category.subCategories.map(sub => {
              if (sub.subCategories?.some(subsub => subsub.id === subcategoryId)) {
                // Remove the sub-subcategory
                const updatedSubSubCategories = sub.subCategories.filter(
                  subsub => subsub.id !== subcategoryId
                );
                
                // Reorder remaining sub-subcategories
                const reorderedSubSubCategories = updatedSubSubCategories.map((subSubCat, index) => ({
                  ...subSubCat,
                  order: index
                }));
                
                return {
                  ...sub,
                  subCategories: reorderedSubSubCategories
                };
              }
              return sub;
            });
            
            await updateCategory(categoryId, { subCategories: updatedSubCategories });
          }
          
          toast.success('Subcategory deleted successfully');
          await loadCategories();
        }
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleMoveCategory = async (categoryId: string, direction: 'up' | 'down') => {
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    if (
      (direction === 'up' && categoryIndex === 0) || 
      (direction === 'down' && categoryIndex === categories.length - 1)
    ) {
      return; // Can't move further in this direction
    }

    const newCategories = [...categories];
    const swapIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;
    
    // Swap the order values
    const tempOrder = newCategories[categoryIndex].order;
    newCategories[categoryIndex].order = newCategories[swapIndex].order;
    newCategories[swapIndex].order = tempOrder;
    
    // Swap the positions in the array
    [newCategories[categoryIndex], newCategories[swapIndex]] = 
      [newCategories[swapIndex], newCategories[categoryIndex]];
    
    setCategories(newCategories);
    
    // Update both categories in Firebase
    try {
      await updateCategory(newCategories[categoryIndex].id, { 
        order: newCategories[categoryIndex].order 
      });
      await updateCategory(newCategories[swapIndex].id, { 
        order: newCategories[swapIndex].order 
      });
      toast.success('Category order updated');
    } catch (error: any) {
      toast.error('Failed to update category order');
      loadCategories(); // Reload to restore original order
    }
  };

  const handleMoveSubcategory = async (categoryId: string, subcategoryId: string, direction: 'up' | 'down') => {
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) return;
    
    const category = categories[categoryIndex];
    const subcategoryIndex = category.subCategories.findIndex(sub => sub.id === subcategoryId);
    
    if (
      (direction === 'up' && subcategoryIndex === 0) || 
      (direction === 'down' && subcategoryIndex === category.subCategories.length - 1)
    ) {
      return; // Can't move further in this direction
    }
    
    const newCategories = [...categories];
    const newSubcategories = [...newCategories[categoryIndex].subCategories];
    const swapIndex = direction === 'up' ? subcategoryIndex - 1 : subcategoryIndex + 1;
    
    // Swap the order values
    const tempOrder = newSubcategories[subcategoryIndex].order;
    newSubcategories[subcategoryIndex].order = newSubcategories[swapIndex].order;
    newSubcategories[swapIndex].order = tempOrder;
    
    // Swap the positions in the array
    [newSubcategories[subcategoryIndex], newSubcategories[swapIndex]] = 
      [newSubcategories[swapIndex], newSubcategories[subcategoryIndex]];
    
    newCategories[categoryIndex].subCategories = newSubcategories;
    setCategories(newCategories);
    
    // Update the category with the new subcategories order
    try {
      await updateCategory(categoryId, { 
        subCategories: newSubcategories 
      });
      toast.success('Subcategory order updated');
    } catch (error: any) {
      toast.error('Failed to update subcategory order');
      loadCategories(); // Reload to restore original order
    }
  };

  const handleMoveSubSubcategory = async (
    categoryId: string, 
    subcategoryId: string, 
    subSubcategoryId: string, 
    direction: 'up' | 'down'
  ) => {
    const categoryIndex = categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) return;
    
    const category = categories[categoryIndex];
    const subcategoryIndex = category.subCategories.findIndex(sub => sub.id === subcategoryId);
    if (subcategoryIndex === -1) return;
    
    const subcategory = category.subCategories[subcategoryIndex];
    if (!subcategory.subCategories) return;
    
    const subSubcategoryIndex = subcategory.subCategories.findIndex(sub => sub.id === subSubcategoryId);
    if (
      (direction === 'up' && subSubcategoryIndex === 0) || 
      (direction === 'down' && subSubcategoryIndex === subcategory.subCategories.length - 1)
    ) {
      return; // Can't move further in this direction
    }
    
    const newCategories = [...categories];
    const newSubcategory = {...newCategories[categoryIndex].subCategories[subcategoryIndex]};
    const newSubSubcategories = [...(newSubcategory.subCategories || [])];
    const swapIndex = direction === 'up' ? subSubcategoryIndex - 1 : subSubcategoryIndex + 1;
    
    // Swap the order values
    const tempOrder = newSubSubcategories[subSubcategoryIndex].order;
    newSubSubcategories[subSubcategoryIndex].order = newSubSubcategories[swapIndex].order;
    newSubSubcategories[swapIndex].order = tempOrder;
    
    // Swap the positions in the array
    [newSubSubcategories[subSubcategoryIndex], newSubSubcategories[swapIndex]] = 
      [newSubSubcategories[swapIndex], newSubSubcategories[subSubcategoryIndex]];
    
    newSubcategory.subCategories = newSubSubcategories;
    newCategories[categoryIndex].subCategories[subcategoryIndex] = newSubcategory;
    setCategories(newCategories);
    
    // Update the category with the new structure
    try {
      await updateCategory(categoryId, { 
        subCategories: newCategories[categoryIndex].subCategories 
      });
      toast.success('Sub-subcategory order updated');
    } catch (error: any) {
      toast.error('Failed to update sub-subcategory order');
      loadCategories(); // Reload to restore original order
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderCategories = () => {
    return categories.map((category, index) => {
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
              <div className="flex items-center">
                <button
                  onClick={() => handleMoveCategory(category.id, 'up')}
                  disabled={index === 0}
                  className={`p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors ${
                    index === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ArrowUpIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleMoveCategory(category.id, 'down')}
                  disabled={index === categories.length - 1}
                  className={`p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors ${
                    index === categories.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ArrowDownIcon className="h-5 w-5" />
                </button>
              </div>
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
              {category.subCategories.map((subCategory, subIndex) => {
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
                        <div className="flex items-center">
                          <button
                            onClick={() => handleMoveSubcategory(category.id, subCategory.id, 'up')}
                            disabled={subIndex === 0}
                            className={`p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors ${
                              subIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <ArrowUpIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleMoveSubcategory(category.id, subCategory.id, 'down')}
                            disabled={subIndex === category.subCategories.length - 1}
                            className={`p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors ${
                              subIndex === category.subCategories.length - 1 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            <ArrowDownIcon className="h-5 w-5" />
                          </button>
                        </div>
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
                        {subCategory.subCategories.map((subSubCategory, subSubIndex) => (
                          <div
                            key={subSubCategory.id}
                            className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-[#FB8A13] border-l-4 border-t-0 border-r-0 border-b-0 border-l-[#FB8A13]"
                          >
                            <span className="text-gray-900 dark:text-white">{subSubCategory.name}</span>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center">
                                <button
                                  onClick={() => handleMoveSubSubcategory(
                                    category.id, 
                                    subCategory.id, 
                                    subSubCategory.id, 
                                    'up'
                                  )}
                                  disabled={subSubIndex === 0}
                                  className={`p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors ${
                                    subSubIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <ArrowUpIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleMoveSubSubcategory(
                                    category.id, 
                                    subCategory.id, 
                                    subSubCategory.id, 
                                    'down'
                                  )}
                                  disabled={subSubIndex === (subCategory.subCategories?.length || 0) - 1}
                                  className={`p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors ${
                                    subSubIndex === (subCategory.subCategories?.length || 0) - 1 ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                >
                                  <ArrowDownIcon className="h-5 w-5" />
                                </button>
                              </div>
                              <button
                                onClick={() => handleDeleteSubcategory(category.id, subSubCategory.id)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
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