import { useCallback } from 'react';
import { useApi } from './useApi';
import { BrandStats, BrandAnalytics, BrandProduct, BrandRetailer } from '../types/brand.types';

export const useBrandApi = () => {
  const { request, loading, error } = useApi();

  /**
   * Fetch brand dashboard statistics
   */
  const fetchBrandStats = useCallback(async (): Promise<BrandStats | null> => {
    try {
      console.log('📊 Fetching brand stats...');
      const response = await request('get', '/brand/stats');
      console.log('✓ Brand stats received:', response.data);
      return response.data;
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
      return null;
    }
  }, [request]);

  /**
   * Fetch all products for the brand
   */
  const fetchBrandProducts = useCallback(async (): Promise<BrandProduct[]> => {
    try {
      console.log('📦 Fetching brand products...');
      const response = await request('get', '/brand/products');
      const products = Array.isArray(response.data) ? response.data : response.data?.products || [];
      console.log('✓ Products received:', products);
      return products;
    } catch (err) {
      console.error('❌ Error fetching products:', err);
      return [];
    }
  }, [request]);

  /**
   * Create a new product
   */
  const createProduct = useCallback(
    async (productData: {
      name: string;
      cylinderSize: string;
      basePrice: string;
      category: string;
      description?: string;
    }): Promise<BrandProduct | null> => {
      try {
        console.log('➕ Creating product:', productData);
        const response = await request('post', '/brand/products', productData);
        console.log('✓ Product created:', response.data);
        return response.data;
      } catch (err) {
        console.error('❌ Error creating product:', err);
        return null;
      }
    },
    [request]
  );

  /**
   * Update a product
   */
  const updateProduct = useCallback(
    async (
      productId: number,
      updateData: {
        name?: string;
        basePrice?: string;
        category?: string;
        description?: string;
        isActive?: boolean;
      }
    ): Promise<BrandProduct | null> => {
      try {
        console.log('✏️ Updating product:', productId, updateData);
        const response = await request('put', `/brand/products/${productId}`, updateData);
        console.log('✓ Product updated:', response.data);
        return response.data;
      } catch (err) {
        console.error('❌ Error updating product:', err);
        return null;
      }
    },
    [request]
  );

  /**
   * Delete a product
   */
  const deleteProduct = useCallback(
    async (productId: number): Promise<boolean> => {
      try {
        console.log('🗑️ Deleting product:', productId);
        await request('delete', `/brand/products/${productId}`);
        console.log('✓ Product deleted');
        return true;
      } catch (err) {
        console.error('❌ Error deleting product:', err);
        return false;
      }
    },
    [request]
  );

  /**
   * Fetch retailers carrying brand products
   */
  const fetchBrandRetailers = useCallback(async (): Promise<BrandRetailer[]> => {
    try {
      console.log('🏪 Fetching brand retailers...');
      const response = await request('get', '/brand/retailers');
      const retailers = Array.isArray(response.data) ? response.data : response.data?.retailers || [];
      console.log('✓ Retailers received:', retailers);
      return retailers;
    } catch (err) {
      console.error('❌ Error fetching retailers:', err);
      return [];
    }
  }, [request]);

  /**
   * Fetch brand analytics
   */
  const fetchBrandAnalytics = useCallback(
    async (period: 'daily' | 'weekly' | 'monthly' = 'monthly'): Promise<BrandAnalytics | null> => {
      try {
        console.log('📈 Fetching brand analytics for period:', period);
        const response = await request('get', `/brand/analytics?period=${period}`);
        console.log('✓ Analytics received:', response.data);
        return response.data;
      } catch (err) {
        console.error('❌ Error fetching analytics:', err);
        return null;
      }
    },
    [request]
  );

  /**
   * Update product pricing
   */
  const updatePricing = useCallback(
    async (productId: number, newBasePrice: string, reason?: string): Promise<boolean> => {
      try {
        console.log('💰 Updating pricing:', { productId, newBasePrice, reason });
        await request('put', '/brand/pricing', {
          productId,
          newBasePrice,
          reason,
        });
        console.log('✓ Pricing updated');
        return true;
      } catch (err) {
        console.error('❌ Error updating pricing:', err);
        return false;
      }
    },
    [request]
  );

  /**
   * Get retailer performance metrics
   */
  const getRetailerPerformance = useCallback(
    async (retailerId: number) => {
      try {
        console.log('📊 Fetching retailer performance:', retailerId);
        const response = await request('get', `/brand/performance/${retailerId}`);
        console.log('✓ Retailer performance received:', response.data);
        return response.data;
      } catch (err) {
        console.error('❌ Error fetching retailer performance:', err);
        return null;
      }
    },
    [request]
  );

  return {
    // Stats
    fetchBrandStats,
    
    // Products
    fetchBrandProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    
    // Retailers
    fetchBrandRetailers,
    getRetailerPerformance,
    
    // Analytics
    fetchBrandAnalytics,
    updatePricing,
    
    // Loading and error state
    loading,
    error,
  };
};