'use client';

import { useState, useEffect } from 'react';
import { createPromotion, getAllPromotions, getAllProducts, uploadImage, deletePromotion, updatePromotion } from '@/lib/firebase';
import type { Promotion, Product } from '@/types';
import toast from 'react-hot-toast';
import { Switch } from '@headlessui/react';
import { CalendarIcon, PhotoIcon, XMarkIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: '',
    startDate: new Date(),
    endDate: new Date(),
    minimumPurchase: '',
    active: true,
    productId: '',
    images: [] as File[],
  });

  useEffect(() => {
    loadPromotions();
    loadProducts();
  }, []);

  const loadPromotions = async () => {
    try {
      const allPromotions = await getAllPromotions();
      setPromotions(allPromotions);
    } catch (error: any) {
      console.error('Error loading promotions:', error);
      toast.error('Failed to load promotions');
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await getAllProducts();
      setProducts(allProducts);
    } catch (error: any) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    }
  };

  const handleDeletePromotion = async (promotionId: string) => {
    if (window.confirm('Are you sure you want to delete this promotion?')) {
      try {
        await deletePromotion(promotionId);
        toast.success('Promotion deleted successfully');
        loadPromotions();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const resetForm = () => {
    setNewPromotion({
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: new Date(),
      endDate: new Date(),
      minimumPurchase: '',
      active: true,
      productId: '',
      images: [],
    });
  };

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const uploadPromises = newPromotion.images.map(async (image) => {
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

      await createPromotion({
        ...newPromotion,
        discountValue: parseFloat(newPromotion.discountValue),
        minimumPurchase: parseFloat(newPromotion.minimumPurchase),
        images: imageUrls,
        startDate: newPromotion.startDate,
        endDate: newPromotion.endDate,
        createdBy: 'admin',
      });

      resetForm();
      setIsModalOpen(false);
      toast.success('Promotion created successfully');
      loadPromotions();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + newPromotion.images.length > 15) {
      toast.error('Maximum 15 images allowed');
      return;
    }
    setNewPromotion(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));
  };

  const removeImage = (index: number) => {
    setNewPromotion(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleEditClick = (promotion: Promotion) => {
    setIsEditing(true);
    setEditingPromotion(promotion);
    setNewPromotion({
      name: promotion.name,
      description: promotion.description,
      discountType: promotion.discountType,
      discountValue: promotion.discountValue.toString(),
      startDate: new Date(promotion.startDate),
      endDate: new Date(promotion.endDate),
      minimumPurchase: promotion.minimumPurchase.toString(),
      active: promotion.active,
      productId: promotion.productId,
      images: [], // Can't load existing files, but will keep existing image URLs
    });
    setIsModalOpen(true);
  };

  const handleUpdatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPromotion) return;
    
    setLoading(true);

    try {
      const uploadPromises = newPromotion.images.map(async (image) => {
        try {
          const imageUrl = await uploadImage(image);
          if (!imageUrl) throw new Error('Failed to upload image');
          return imageUrl;
        } catch (error) {
          console.error('Error uploading image:', error);
          throw error;
        }
      });

      const newImageUrls = await Promise.all(uploadPromises);
      
      // Combine existing images that weren't deleted with new ones
      const existingImages = editingPromotion.images || [];
      const allImages = [...existingImages, ...newImageUrls];

      await updatePromotion(editingPromotion.id!, {
        ...newPromotion,
        discountValue: parseFloat(newPromotion.discountValue),
        minimumPurchase: parseFloat(newPromotion.minimumPurchase),
        images: allImages,
        startDate: newPromotion.startDate,
        endDate: newPromotion.endDate,
      });

      resetForm();
      setIsModalOpen(false);
      setIsEditing(false);
      setEditingPromotion(null);
      toast.success('Promotion updated successfully');
      loadPromotions();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Promotions</h1>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">
            Manage your promotional campaigns
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-[#FB8A13] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e07911] focus:outline-none focus:ring-2 focus:ring-[#FB8A13] focus:ring-offset-2"
          >
            Add promotion
          </button>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="mt-8 flex flex-col">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-white sm:pl-6">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Discount
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Product
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Period
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Status
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                  {promotions.map((promotion) => (
                    <tr key={promotion.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                        <div className="flex items-center">
                          {promotion.images?.[0] && (
                            <div className="h-24 w-24 flex-shrink-0">
                              <img className="h-24 w-24 rounded-lg border border-gray-200 dark:border-gray-700 object-cover" src={promotion.images[0]} alt="" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="font-medium text-gray-900 dark:text-white">{promotion.name}</div>
                            <div className="text-gray-500 dark:text-gray-400">{promotion.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {promotion.discountType === 'percentage' ? `${promotion.discountValue}%` : `$${promotion.discountValue}`}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {products.find(p => p.id === promotion.productId)?.name || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          promotion.active ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {promotion.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        <div className="flex justify-end gap-4">
                          <button
                            onClick={() => handleEditClick(promotion)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-full transition-colors duration-200"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDeletePromotion(promotion.id!)}
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

      {/* Add Promotion Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity" />
            <div className="inline-block transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6 sm:align-middle">
              <div className="sm:flex sm:items-start">
                <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {isEditing ? 'Edit Promotion' : 'Add New Promotion'}
                  </h3>
                  <div className="mt-2">
                    <form onSubmit={isEditing ? handleUpdatePromotion : handleCreatePromotion} className="space-y-6">
                      <div>
                        <label htmlFor="name" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                          Promotion Name
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={newPromotion.name}
                          onChange={(e) => setNewPromotion({ ...newPromotion, name: e.target.value })}
                          className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                          placeholder="Enter promotion name"
                        />
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                          Description
                        </label>
                        <textarea
                          id="description"
                          name="description"
                          rows={4}
                          required
                          value={newPromotion.description}
                          onChange={(e) => setNewPromotion({ ...newPromotion, description: e.target.value })}
                          className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                          placeholder="Enter promotion description"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="discountType" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                            Discount Type
                          </label>
                          <select
                            id="discountType"
                            name="discountType"
                            value={newPromotion.discountType}
                            onChange={(e) => setNewPromotion({ ...newPromotion, discountType: e.target.value as 'percentage' | 'fixed' })}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                          >
                            <option value="percentage">Percentage</option>
                            <option value="fixed">Fixed Amount</option>
                          </select>
                        </div>

                        <div>
                          <label htmlFor="discountValue" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                            Discount Value
                          </label>
                          <input
                            type="number"
                            name="discountValue"
                            id="discountValue"
                            required
                            min="0"
                            step={newPromotion.discountType === 'percentage' ? '1' : '0.01'}
                            value={newPromotion.discountValue}
                            onChange={(e) => setNewPromotion({ ...newPromotion, discountValue: e.target.value })}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                            placeholder={newPromotion.discountType === 'percentage' ? '0%' : '$0.00'}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="startDate" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            id="startDate"
                            required
                            value={newPromotion.startDate.toISOString().split('T')[0]}
                            onChange={(e) => setNewPromotion({ ...newPromotion, startDate: new Date(e.target.value) })}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                          />
                        </div>

                        <div>
                          <label htmlFor="endDate" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            id="endDate"
                            required
                            value={newPromotion.endDate.toISOString().split('T')[0]}
                            onChange={(e) => setNewPromotion({ ...newPromotion, endDate: new Date(e.target.value) })}
                            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="minimumPurchase" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                          Minimum Purchase
                        </label>
                        <input
                          type="number"
                          name="minimumPurchase"
                          id="minimumPurchase"
                          required
                          min="0"
                          step="0.01"
                          value={newPromotion.minimumPurchase}
                          onChange={(e) => setNewPromotion({ ...newPromotion, minimumPurchase: e.target.value })}
                          className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                          placeholder="$0.00"
                        />
                      </div>

                      <div>
                        <label htmlFor="product" className="block text-base font-medium text-gray-900 dark:text-white mb-2">
                          Select Product
                        </label>
                        <select
                          id="product"
                          name="product"
                          required
                          value={newPromotion.productId}
                          onChange={(e) => setNewPromotion({ ...newPromotion, productId: e.target.value })}
                          className="block w-full rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-[#FB8A13] focus:ring-[#FB8A13] dark:bg-gray-700 dark:text-white text-base text-gray-900 py-3 px-4"
                        >
                          <option value="">Select a product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label htmlFor="active" className="block text-base font-medium text-gray-900 dark:text-white">
                            Active Status
                          </label>
                          <Switch
                            checked={newPromotion.active}
                            onChange={(checked: boolean) => setNewPromotion({ ...newPromotion, active: checked })}
                            className={`${
                              newPromotion.active ? 'bg-[#FB8A13]' : 'bg-gray-200 dark:bg-gray-700'
                            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#FB8A13] focus:ring-offset-2`}
                          >
                            <span
                              className={`${
                                newPromotion.active ? 'translate-x-5' : 'translate-x-0'
                              } pointer-events-none relative inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                            />
                          </Switch>
                        </div>
                      </div>

                      <div>
                        <label className="block text-base font-medium text-gray-900 dark:text-white mb-2">Promotion Images</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg">
                          <div className="space-y-1 text-center">
                            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                            <div className="flex text-sm text-gray-600 dark:text-gray-400">
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
                            <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 15 images</p>
                          </div>
                        </div>
                        
                        {/* Existing Images */}
                        {isEditing && editingPromotion?.images && editingPromotion.images.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Existing Images</h4>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                              {editingPromotion.images.map((imageUrl, index) => (
                                <div key={`existing-${index}`} className="relative group aspect-square">
                                  <div className="h-full w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
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
                        {newPromotion.images.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">New Images</h4>
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                              {newPromotion.images.map((image, index) => (
                                <div key={`new-${index}`} className="relative group aspect-square">
                                  <div className="h-full w-full overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
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
                              setIsModalOpen(false);
                              setIsEditing(false);
                              setEditingPromotion(null);
                              resetForm();
                            }}
                            className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 px-4 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FB8A13] focus:ring-offset-2"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex justify-center rounded-md border border-transparent bg-[#FB8A13] py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-[#e07911] focus:outline-none focus:ring-2 focus:ring-[#FB8A13] focus:ring-offset-2 disabled:opacity-50"
                          >
                            {loading ? (isEditing ? 'Updating...' : 'Adding...') : (isEditing ? 'Update Promotion' : 'Add Promotion')}
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