'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';

interface SimpleFileDownloaderProps {
  fileId: string;
  fileName?: string;
  className?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const SimpleFileDownloader: React.FC<SimpleFileDownloaderProps> = ({
  fileId,
  fileName,
  className = '',
  buttonText = 'Download File',
  buttonVariant = 'default',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadFile = async () => {
    if (!fileId) {
      setError('No file ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/api/simple-file/${fileId}?preview=false&t=${timestamp}`;
      
      // Use fetch instead of window.open to handle authentication properly
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      
      // Get the file blob
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Try to get the filename from response headers or use the default
      const contentDisposition = response.headers.get('content-disposition');
      const downloadName = 
        contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
          : fileName || `file-${fileId}`;
      
      link.download = downloadName;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Release the blob URL
      window.URL.revokeObjectURL(blobUrl);
      
      setLoading(false);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(err instanceof Error ? err.message : 'Error downloading file');
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <Button
        variant={buttonVariant}
        onClick={downloadFile}
        disabled={loading || !fileId}
        className={className}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            {buttonText}
          </>
        )}
      </Button>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default SimpleFileDownloader; 