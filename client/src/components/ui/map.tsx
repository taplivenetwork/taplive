import { useEffect, useRef } from 'react';
import type { Order } from '@shared/schema';

interface MapProps {
  orders: Order[];
  onLocationSelect?: (lat: number, lng: number) => void;
  className?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

declare global {
  interface Window {
    L: any;
  }
}

export function Map({ orders, onLocationSelect, className, center, zoom = 13 }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Load Leaflet CSS and JS if not already loaded
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initializeMap;
      document.head.appendChild(script);
    } else {
      initializeMap();
    }

    function initializeMap() {
      if (!window.L || !mapRef.current || mapInstanceRef.current) return;

      // Initialize map with provided center or default to New York
      const defaultCenter = center || { lat: 40.7128, lng: -74.0060 };
      const map = window.L.map(mapRef.current).setView([defaultCenter.lat, defaultCenter.lng], zoom);
      mapInstanceRef.current = map;

      // Add tile layer
      window.L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      // Add click handler for location selection
      if (onLocationSelect) {
        map.on('click', (e: any) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }

      // Add order markers
      updateMarkers();
    }

    function updateMarkers() {
      if (!mapInstanceRef.current || !window.L) return;

      orders.forEach(order => {
        const lat = parseFloat(order.latitude);
        const lng = parseFloat(order.longitude);
        
        const categoryIcons: Record<string, string> = {
          music: '♪',
          food: '🍽',
          fitness: '🧘',
          travel: '🗺',
          events: '🎉',
          education: '📚'
        };

        const icon = window.L.divIcon({
          html: `<div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg animate-pulse-glow">${categoryIcons[order.category] || '📍'}</div>`,
          className: 'custom-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = window.L.marker([lat, lng], { icon }).addTo(mapInstanceRef.current);
        
        marker.bindPopup(`
          <div class="p-2">
            <h4 class="font-semibold text-sm">${order.title}</h4>
            <p class="text-xs text-gray-600 mt-1">${order.description.substring(0, 100)}...</p>
            <div class="flex items-center justify-between mt-2">
              <span class="text-xs bg-primary/20 text-primary px-2 py-1 rounded">${order.status}</span>
              <span class="text-sm font-bold">$${order.price}</span>
            </div>
          </div>
        `);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [orders, onLocationSelect]);

  // Update map center when center prop changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center, zoom]);

  return (
    <div 
      ref={mapRef} 
      className={`map-container ${className || ''}`}
      data-testid="map-container"
    />
  );
}
