'use client';

import { useState, useEffect } from 'react';
import { createProduct, deleteProduct, getAllProducts, getAllCategories, updateProduct, uploadImage } from '@/lib/firebase';
import type { Product, Category } from '@/types';
import toast from 'react-hot-toast';
import { PencilIcon, TrashIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import DebugInfo from '@/components/DebugInfo';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    subcategory: '',
    subsubcategory: '',
    images: [] as File[],
  });
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
    key: '',
    direction: null,
  });
  const { user: currentUser } = useAuth();

  // Get the selected category object
  const selectedCategory = categories.find(cat => cat.id === newProduct.category);
  // Get subcategories of selected category
  const subcategories = selectedCategory?.subCategories || [];
  // Get the selected subcategory object
  const selectedSubcategory = subcategories.find(sub => sub.id === newProduct.subcategory);
  // Get subsubcategories of selected subcategory
  const subsubcategories = selectedSubcategory?.subCategories || [];

  // Filter products based on search query
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      // Reset to original order but keep the search filter
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setProducts([...products]); // Reset the main products array
      return;
    }

    const sortedProducts = [...products].sort((a, b) => {
      if (key === 'name') {
        return direction === 'asc'
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      }
      if (key === 'stock') {
        return direction === 'asc'
          ? (a.stock || 0) - (b.stock || 0)
          : (b.stock || 0) - (a.stock || 0);
      }
      if (key === 'price') {
        return direction === 'asc'
          ? (a.price || 0) - (b.price || 0)
          : (b.price || 0) - (a.price || 0);
      }
      return 0;
    });

    setProducts(sortedProducts);
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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const categoriesData = await getAllCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to fetch categories');
    }
  }

  async function fetchProducts() {
    try {
      const productsData = await getAllProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to fetch products');
    }
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const uploadPromises = newProduct.images.map(async (image) => {
        try {
          const imageUrl = await uploadImage(image);
          if (!imageUrl) throw new Error('Failed to upload image');
          return imageUrl;
        } catch (error) {
          console.error('Error uploading image:', error);
          throw error;
        }
      });

      const imageUrls = await Promise.all(uploadPromises);

      await createProduct({
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: newProduct.category || null,
        subcategory: newProduct.subcategory || null,
        subsubcategory: newProduct.subsubcategory || null,
        images: imageUrls,
      });

      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        subcategory: '',
        subsubcategory: '',
        images: [],
      });
      toast.success('Product added successfully');
      fetchProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProduct(product: Product) {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(product.id);
        toast.success('Product deleted successfully');
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        toast.error('Failed to delete product');
      }
    }
  }

  const toggleDescription = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  // Reset subcategory and subsubcategory when category changes
  const handleCategoryChange = (categoryId: string) => {
    setNewProduct({
      ...newProduct,
      category: categoryId,
      subcategory: '',
      subsubcategory: '',
    });
  };

  // Reset subsubcategory when subcategory changes
  const handleSubcategoryChange = (subcategoryId: string) => {
    setNewProduct({
      ...newProduct,
      subcategory: subcategoryId,
      subsubcategory: '',
    });
  };

  const handleEditClick = (product: Product) => {
    setIsEditing(true);
    setEditingProduct(product);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      category: product.category || '',
      subcategory: product.subcategory || '',
      subsubcategory: product.subsubcategory || '',
      images: [], // Can't load existing files, but will keep existing image URLs
    });
    setIsAddModalOpen(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    setLoading(true);

    try {
      const uploadPromises = newProduct.images.map(async (image) => {
        try {
          const imageUrl = await uploadImage(new File([], image.name));
          if (!imageUrl) throw new Error('Failed to upload image');
          return imageUrl;
        } catch (error) {
          console.error('Error uploading image:', error);
          throw error;
        }
      });

      const newImageUrls = await Promise.all(uploadPromises);
      
      // Combine existing images that weren't deleted with new ones
      const existingImages = editingProduct.images || [];
      const allImages = [...existingImages, ...newImageUrls];

      await updateProduct(editingProduct.id, {
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock),
        category: newProduct.category || null,
        subcategory: newProduct.subcategory || null,
        subsubcategory: newProduct.subsubcategory || null,
        images: allImages,
      });

      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        subcategory: '',
        subsubcategory: '',
        images: [],
      });
      setIsEditing(false);
      setEditingProduct(null);
      toast.success('Product updated successfully');
      fetchProducts();
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      setNewProduct(prev => ({
        ...prev,
        images: [...prev.images, ...newImages]
      }));
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...newProduct.images];
    newImages.splice(index, 1);
    setNewProduct({ ...newProduct, images: newImages });
  };

  const debugData = {
    currentUser: {
      uid: currentUser?.uid,
      email: currentUser?.email,
    },
    totalProducts: products.length,
    filteredProducts: filteredProducts.length,
    categories: [...new Set(products.map(p => p.category))],
    priceRange: {
      min: Math.min(...products.map(p => p.price)),
      max: Math.max(...products.map(p => p.price)),
    },
  };

  const debugSummaryItems = [
    { label: 'Total Products', value: debugData.totalProducts },
    { label: 'Categories', value: debugData.categories.length },
    { label: 'Filtered', value: debugData.filteredProducts },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {process.env.NODE_ENV === 'development' && (
        <DebugInfo data={debugData} summaryItems={debugSummaryItems} />
      )}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            A list of all products in your store
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#FB8A13] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e07911] focus:outline-none focus:ring-2 focus:ring-[#FB8A13] focus:ring-offset-2"
          >
            Add product
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="mt-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name or description..."
            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4 pr-10"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="mt-10">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden shadow-lg ring-1 ring-black ring-opacity-5 rounded-lg">
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
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6"
                    >
                      Category
                    </th>
                    <th 
                      scope="col" 
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('stock')}
                    >
                      <div className="flex items-center gap-1">
                        Stock {getSortIcon('stock')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => handleSort('price')}
                    >
                      <div className="flex items-center gap-1">
                        Price {getSortIcon('price')}
                      </div>
                    </th>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          {product.images[0] && (
                            <div className="h-24 w-24 border border-gray-300 dark:border-gray-700 rounded-lg">
                              <img className="h-24 w-24 rounded-lg object-cover" src={product.images[0]} alt="" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                            <div className="flex flex-col">
                              <div className={`text-gray-500 dark:text-gray-400 text-sm max-w-[300px] break-words whitespace-pre-wrap ${
                                expandedProducts.has(product.id) ? '' : 'line-clamp-2'
                              }`}>
                                {product.description}
                              </div>
                              {product.description.length > 30 && (
                                <button
                                  onClick={() => toggleDescription(product.id)}
                                  className="text-indigo-600 dark:text-indigo-400 text-sm hover:text-indigo-800 dark:hover:text-indigo-300 mt-1 text-left"
                                >
                                  {expandedProducts.has(product.id) ? 'See less' : 'See more'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm text-gray-500 dark:text-gray-400">
                        {(() => {
                          const category = categories.find(cat => cat.id === product.category);
                          if (!category) return product.category || '-';
                          
                          const subcategory = category.subCategories?.find(sub => sub.id === product.subcategory);
                          if (!subcategory) return category.name;
                          
                          const subsubcategory = subcategory.subCategories?.find(subsub => subsub.id === product.subsubcategory);
                          if (!subsubcategory) return `${category.name} > ${subcategory.name}`;
                          
                          return `${category.name} > ${subcategory.name} > ${subsubcategory.name}`;
                        })()}
                      </td>
                      <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm text-gray-500 dark:text-gray-400">
                        {product.stock}
                      </td>
                      <td className="whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm text-gray-500 dark:text-gray-400">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="relative whitespace-nowrap py-3.5 pl-4 pr-3 text-left text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-4">
                          <button
                            onClick={() => handleEditClick(product)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors duration-200"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors duration-200"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:align-middle">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {isEditing ? 'Edit Product' : 'Add New Product'}
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={isEditing ? handleUpdateProduct : handleAddProduct} className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                          Product Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={newProduct.name}
                          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                          className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                          placeholder="Enter product name"
                        />
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          id="description"
                          required
                          rows={4}
                          value={newProduct.description}
                          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                          className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                          placeholder="Enter product description"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="price" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                            Price ($)
                          </label>
                          <input
                            type="number"
                            name="price"
                            id="price"
                            required
                            step="0.01"
                            value={newProduct.price}
                            onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                            placeholder="0.00"
                          />
                        </div>

                        <div>
                          <label htmlFor="stock" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                            Stock
                          </label>
                          <input
                            type="number"
                            name="stock"
                            id="stock"
                            required
                            value={newProduct.stock}
                            onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="category" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                          Category
                        </label>
                        <select
                          id="category"
                          name="category"
                          value={newProduct.category}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {newProduct.category && subcategories.length > 0 && (
                        <div>
                          <label htmlFor="subcategory" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                            Subcategory
                          </label>
                          <select
                            id="subcategory"
                            name="subcategory"
                            value={newProduct.subcategory}
                            onChange={(e) => handleSubcategoryChange(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                          >
                            <option value="">Select a subcategory</option>
                            {subcategories.map((subcategory) => (
                              <option key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {newProduct.subcategory && subsubcategories.length > 0 && (
                        <div>
                          <label htmlFor="subsubcategory" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                            Sub-subcategory
                          </label>
                          <select
                            id="subsubcategory"
                            name="subsubcategory"
                            value={newProduct.subsubcategory}
                            onChange={(e) => setNewProduct({ ...newProduct, subsubcategory: e.target.value })}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                          >
                            <option value="">Select a sub-subcategory</option>
                            {subsubcategories.map((subsubcategory) => (
                              <option key={subsubcategory.id} value={subsubcategory.id}>
                                {subsubcategory.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-base font-medium text-gray-900 dark:text-white mb-2">Product Images</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                          <div className="space-y-1 text-center">
                            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="images"
                                className="relative cursor-pointer rounded-md bg-white dark:bg-gray-800 font-medium text-[#FB8A13] focus-within:outline-none focus-within:ring-2 focus-within:ring-[#FB8A13] focus-within:ring-offset-2 hover:text-[#e07911]"
                              >
                                <span>Upload images</span>
                                <input
                                  id="images"
                                  name="images"
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="sr-only"
                                  onChange={handleImageUpload}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 15 images</p>
                          </div>
                        </div>

                        {/* Existing Images */}
                        {isEditing && editingProduct?.images && editingProduct.images.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2 dark:text-white">Existing Images</h4>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                              {editingProduct.images.map((imageUrl, index) => (
                                <div key={`existing-${index}`} className="relative group aspect-square">
                                  <div className="h-full w-full overflow-hidden rounded-lg bg-gray-100">
                                    <img
                                      src={imageUrl}
                                      alt={`Existing ${index + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* New Images */}
                        {newProduct.images.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">New Images</h4>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                              {newProduct.images.map((image, index) => (
                                <div key={`new-${index}`} className="relative group aspect-square">
                                  <div className="h-full w-full overflow-hidden rounded-lg bg-gray-100">
                                    <img
                                      src={URL.createObjectURL(image)}
                                      alt={`Preview ${index + 1}`}
                                      className="h-full w-full object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeImage(index)}
                                      className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <XMarkIcon className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="pt-5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddModalOpen(false);
                              setIsEditing(false);
                              setEditingProduct(null);
                              setNewProduct({
                                name: '',
                                description: '',
                                price: '',
                                stock: '',
                                category: '',
                                subcategory: '',
                                subsubcategory: '',
                                images: [],
                              });
                            }}
                            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center rounded-md border border-transparent bg-[#FB8A13] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#e07911] focus:outline-none focus:ring-2 focus:ring-[#FB8A13] focus:ring-offset-2 disabled:opacity-50"
                          >
                            {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Product' : 'Add Product')}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 