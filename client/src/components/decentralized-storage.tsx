import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { LighthouseService, FileInfo } from '@/lib/lighthouse';
import { 
  Upload, 
  Download, 
  Link, 
  CheckCircle, 
  XCircle, 
  Clock,
  HardDrive,
  Globe,
  Shield,
  Zap
} from 'lucide-react';

interface DecentralizedStorageProps {
  streamId?: string;
  onUploadComplete?: (fileInfo: FileInfo) => void;
}

export function DecentralizedStorage({ streamId, onUploadComplete }: DecentralizedStorageProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [storageStats, setStorageStats] = useState({
    totalFiles: 0,
    totalSize: 0,
    decentralizedPercentage: 0
  });

  // Load existing files on mount
  useEffect(() => {
    loadStorageStats();
  }, []);

  const loadStorageStats = async () => {
    // Mock data for demo - in real app, this would come from your database
    setStorageStats({
      totalFiles: 12,
      totalSize: 2.5, // GB
      decentralizedPercentage: 75
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await LighthouseService.uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      const fileInfo: FileInfo = {
        hash: response.data.Hash,
        name: response.data.Name,
        size: parseInt(response.data.Size),
        url: LighthouseService.getGatewayUrl(response.data.Hash)
      };

      setUploadedFiles(prev => [...prev, fileInfo]);
      
      if (onUploadComplete) {
        onUploadComplete(fileInfo);
      }

      toast({
        title: "File Uploaded to IPFS",
        description: `File stored with hash: ${fileInfo.hash.slice(0, 10)}...`,
      });

    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoUpload = async (videoBlob: Blob, filename: string) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const fileInfo = await LighthouseService.uploadVideoStream(videoBlob, filename);
      
      setUploadedFiles(prev => [...prev, fileInfo]);
      
      toast({
        title: "Video Uploaded to IPFS",
        description: `Video stored with hash: ${fileInfo.hash.slice(0, 10)}...`,
      });

      return fileInfo;
    } catch (error: any) {
      toast({
        title: "Video Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleMetadataUpload = async (metadata: any) => {
    try {
      setUploading(true);
      
      const fileInfo = await LighthouseService.uploadStreamMetadata(metadata);
      
      setUploadedFiles(prev => [...prev, fileInfo]);
      
      toast({
        title: "Metadata Uploaded to IPFS",
        description: `Metadata stored with hash: ${fileInfo.hash.slice(0, 10)}...`,
      });

      return fileInfo;
    } catch (error: any) {
      toast({
        title: "Metadata Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (fileInfo: FileInfo) => {
    try {
      const blob = await LighthouseService.getFile(fileInfo.hash);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileInfo.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({
      title: "Hash Copied",
      description: "IPFS hash copied to clipboard",
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL Copied",
      description: "IPFS URL copied to clipboard",
    });
  };

  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Decentralized Storage Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{storageStats.totalFiles}</div>
              <div className="text-sm text-muted-foreground">Total Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{storageStats.totalSize} GB</div>
              <div className="text-sm text-muted-foreground">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{storageStats.decentralizedPercentage}%</div>
              <div className="text-sm text-muted-foreground">Decentralized</div>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Decentralization Progress</span>
              <span className="text-sm text-muted-foreground">{storageStats.decentralizedPercentage}%</span>
            </div>
            <Progress value={storageStats.decentralizedPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload to IPFS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept="video/*,image/*,.json"
            />
            <label
              htmlFor="file-upload"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90"
            >
              <Upload className="w-4 h-4" />
              Choose File
            </label>
            
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
              variant="outline"
            >
              {uploading ? "Uploading..." : "Upload File"}
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Uploading to IPFS...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decentralized Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              IPFS Benefits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Decentralized storage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Immutable content</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">No single point of failure</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Content addressing</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Cryptographic hashing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Tamper-proof content</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Redundant storage</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm">Censorship resistant</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5" />
              Uploaded Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Link className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {file.size} bytes • {file.hash.slice(0, 10)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyHash(file.hash)}
                    >
                      Copy Hash
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyUrl(file.url)}
                    >
                      Copy URL
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* IPFS Gateway Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            IPFS Gateways
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 border rounded-lg">
              <div className="font-medium">Lighthouse Gateway</div>
              <div className="text-sm text-muted-foreground">gateway.lighthouse.storage</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-medium">IPFS.io Gateway</div>
              <div className="text-sm text-muted-foreground">ipfs.io</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-medium">Cloudflare Gateway</div>
              <div className="text-sm text-muted-foreground">cloudflare-ipfs.com</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="font-medium">Protocol Labs</div>
              <div className="text-sm text-muted-foreground">dweb.link</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
