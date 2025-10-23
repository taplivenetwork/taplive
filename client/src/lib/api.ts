import { queryClient } from "./queryclient";
import type { Order, InsertOrder } from "@shared/schema";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    total: number;
    timestamp: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: any[];
}

export const api = {
  orders: {
    getAll: async (params?: { status?: string; latitude?: number; longitude?: number; radius?: number }): Promise<ApiResponse<Order[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.latitude) searchParams.append('latitude', params.latitude.toString());
      if (params?.longitude) searchParams.append('longitude', params.longitude.toString());
      if (params?.radius) searchParams.append('radius', params.radius.toString());
      
      const url = `/api/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }
      
      return response.json();
    },

    getById: async (id: string): Promise<ApiResponse<Order>> => {
      const response = await fetch(`/api/orders/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }
      
      return response.json();
    },

    create: async (order: InsertOrder): Promise<ApiResponse<Order>> => {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }
      
      return response.json();
    },

    update: async (id: string, updates: Partial<Order>): Promise<ApiResponse<Order>> => {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.statusText}`);
      }
      
      return response.json();
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
      const response = await fetch(`/api/orders/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete order: ${response.statusText}`);
      }
      
      return response.json();
    },
  },

  health: {
    check: async () => {
      const response = await fetch('/api/health');
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      return response.json();
    },
  },
};

export const invalidateOrders = () => {
  queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
};
