import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/translated-text';
import { Image, Users, Eye } from 'lucide-react';

interface StreamViewerProps {
  streamId: string;
  isLive: boolean;
  onViewerCountChange: (count: number) => void;
}

export function StreamViewer({ streamId, isLive, onViewerCountChange }: StreamViewerProps) {
  const [viewerCount, setViewerCount] = useState(1);

  useEffect(() => {
    if (isLive) {
      // Simulate viewer count changes
      const interval = setInterval(() => {
        const newCount = Math.floor(Math.random() * 5) + 1;
        setViewerCount(newCount);
        onViewerCountChange(newCount);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [isLive, onViewerCountChange]);

  // Mock service images for demonstration
  const serviceImages = [
    'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1556741533-974f8e62a92d?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1556741533-6e3b8d97d11c?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1556741533-974f8e62a92e?w=300&h=200&fit=crop'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <TranslatedText>服务查看</TranslatedText>
          <div className="flex items-center gap-2">
            {isLive && (
              <>
                <Badge variant="default">
                  <Eye className="w-3 h-3 mr-1" />
                  <TranslatedText>观看中</TranslatedText>
                </Badge>
                <Badge variant="secondary">
                  <Users className="w-3 h-3 mr-1" />
                  {viewerCount}
                </Badge>
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Service Display */}
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
          {isLive ? (
            <div className="grid grid-cols-2 gap-2 p-2 h-full">
              {serviceImages.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={image}
                    alt={`服务展示 ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  <TranslatedText>等待服务提供者开始服务</TranslatedText>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Status Info */}
        <div className="text-center">
          {isLive ? (
            <div className="space-y-2">
              <p className="text-sm text-green-600 font-medium">
                <TranslatedText>✅ 服务提供者正在展示服务内容</TranslatedText>
              </p>
              <p className="text-xs text-gray-500">
                <TranslatedText>{`当前 ${viewerCount} 人在观看此服务`}</TranslatedText>
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              <TranslatedText>服务尚未开始，请耐心等待</TranslatedText>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}