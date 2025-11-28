import { queryClient } from "./queryClient";
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

// Global auth token getter (will be set by App.tsx)
let getAuthToken: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  getAuthToken = getter;
};

// Authenticated fetch wrapper that automatically adds auth headers
export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken ? await getAuthToken() : null;
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
};

export const api = {
  orders: {
    getAll: async (params?: { status?: string; latitude?: number; longitude?: number; radius?: number }): Promise<ApiResponse<Order[]>> => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.append('status', params.status);
      if (params?.latitude) searchParams.append('latitude', params.latitude.toString());
      if (params?.longitude) searchParams.append('longitude', params.longitude.toString());
      if (params?.radius) searchParams.append('radius', params.radius.toString());
      
      const url = `/api/orders${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
      const response = await authFetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.statusText}`);
      }
      
      return response.json();
    },

    getById: async (id: string): Promise<ApiResponse<Order>> => {
      const response = await authFetch(`/api/orders/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }
      
      return response.json();
    },

    create: async (order: InsertOrder): Promise<ApiResponse<Order>> => {
      const response = await authFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }
      
      return response.json();
    },

    update: async (id: string, updates: Partial<Order>): Promise<ApiResponse<Order>> => {
      const response = await authFetch(`/api/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update order: ${response.statusText}`);
      }
      
      return response.json();
    },

    delete: async (id: string): Promise<ApiResponse<void>> => {
      const response = await authFetch(`/api/orders/${id}`, {
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
      const response = await fetch('/healthz');
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
