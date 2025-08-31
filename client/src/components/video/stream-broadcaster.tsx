import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TranslatedText } from '@/components/translated-text';
import { Upload, Image, CheckCircle, X } from 'lucide-react';

interface StreamBroadcasterProps {
  orderId: string;
  onStreamStart: () => void;
  onStreamEnd: () => void;
}

export function StreamBroadcaster({ orderId, onStreamStart, onStreamEnd }: StreamBroadcasterProps) {
  const [images, setImages] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setUploadError(null);
    
    Array.from(files).forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        setUploadError('图片大小不能超过5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImages(prev => [...prev, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const startService = () => {
    if (images.length === 0) {
      setUploadError('请至少上传一张图片');
      return;
    }
    setIsActive(true);
    onStreamStart();
  };

  const stopService = () => {
    setIsActive(false);
    onStreamEnd();
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <TranslatedText>服务展示</TranslatedText>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="default">
                <CheckCircle className="w-3 h-3 mr-1" />
                <TranslatedText>服务中</TranslatedText>
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Display */}
        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
          {images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 p-2 h-full">
              {images.slice(0, 4).map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`服务图片 ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  {!isActive && (
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  <TranslatedText>上传服务相关图片</TranslatedText>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Section */}
        {!isActive && (
          <div className="space-y-3">
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <div className="flex items-center gap-2 text-gray-500">
                <Upload className="w-5 h-5" />
                <span className="text-sm">
                  <TranslatedText>选择图片 (最多4张, 每张≤5MB)</TranslatedText>
                </span>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={images.length >= 4}
              />
            </label>
            
            {images.length > 0 && (
              <p className="text-sm text-gray-600 text-center">
                <TranslatedText>{`已上传 ${images.length} 张图片`}</TranslatedText>
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {uploadError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{uploadError}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!isActive ? (
            <Button 
              onClick={startService} 
              className="flex-1"
              disabled={images.length === 0}
              data-testid="start-service-button"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              <TranslatedText>开始服务</TranslatedText>
            </Button>
          ) : (
            <Button 
              onClick={stopService} 
              variant="destructive"
              className="flex-1"
              data-testid="stop-service-button"
            >
              <TranslatedText>结束服务</TranslatedText>
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center">
          <TranslatedText>
            {isActive 
              ? '服务进行中，客户可以查看您提供的服务内容'
              : '上传相关图片来展示您的服务内容，替代不稳定的视频直播'}
          </TranslatedText>
        </p>
      </CardContent>
    </Card>
  );
}