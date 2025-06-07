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

  const downloadFile = () => {
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
      
      // Open in a new tab to download
      window.open(url, '_blank');
      
      setLoading(false);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Error downloading file');
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