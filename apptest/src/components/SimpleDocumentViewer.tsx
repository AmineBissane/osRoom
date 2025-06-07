'use client';

import React, { useState, useEffect } from 'react';
import SimpleFileDownloader from './SimpleFileDownloader';
import { FileX } from 'lucide-react';

interface SimpleDocumentViewerProps {
  fileId: string;
  height?: string;
  width?: string;
  className?: string;
  showDownloadButton?: boolean;
  forceFileType?: 'pdf' | 'image';
}

const SimpleDocumentViewer: React.FC<SimpleDocumentViewerProps> = ({
  fileId,
  height = '600px',
  width = '100%',
  className = '',
  showDownloadButton = true,
  forceFileType,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'unknown'>('unknown');
  const [iframeKey, setIframeKey] = useState<number>(Date.now());

  // Build the file URL with timestamp to prevent caching
  const getFileUrl = (): string => {
    const timestamp = new Date().getTime();
    return `/api/simple-file/${fileId}?preview=true&t=${timestamp}`;
  };

  // Determine file type based on fileId or use forced type
  useEffect(() => {
    if (forceFileType) {
      setFileType(forceFileType);
      return;
    }

    // Try to detect from fileId
    if (fileId.toLowerCase().endsWith('.pdf')) {
      setFileType('pdf');
    } else if (
      fileId.toLowerCase().endsWith('.png') ||
      fileId.toLowerCase().endsWith('.jpg') ||
      fileId.toLowerCase().endsWith('.jpeg') ||
      fileId.toLowerCase().endsWith('.gif')
    ) {
      setFileType('image');
    } else {
      // If we can't clearly detect from extension, check if the fileId contains format hints
      if (fileId.toLowerCase().includes('pdf')) {
        setFileType('pdf');
      } else if (
        fileId.toLowerCase().includes('png') ||
        fileId.toLowerCase().includes('jpg') ||
        fileId.toLowerCase().includes('jpeg') ||
        fileId.toLowerCase().includes('image')
      ) {
        setFileType('image');
      } else {
        // Default to PDF if we can't determine
        setFileType('pdf');
      }
    }
  }, [fileId, forceFileType]);

  // Force iframe refresh when fileId changes
  useEffect(() => {
    setIframeKey(Date.now());
    setLoading(true);
    setError(null);
  }, [fileId]);

  // Handle loading state
  const handleLoad = () => {
    setLoading(false);
  };

  // Handle error state
  const handleError = () => {
    setLoading(false);
    setError('Failed to load document');
  };
  
  return (
    <div className={`simple-document-viewer ${className}`} style={{ width }}>
      {loading && (
        <div className="flex justify-center items-center" style={{ height }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error ? (
        <div className="flex flex-col justify-center items-center text-red-500" style={{ height }}>
          <FileX className="h-12 w-12 mb-2" />
          <p>{error}</p>
          {showDownloadButton && (
            <div className="mt-4">
              <SimpleFileDownloader 
                fileId={fileId} 
                buttonText="Download Instead" 
                buttonVariant="outline"
              />
            </div>
          )}
        </div>
      ) : (
        <>
          {fileType === 'pdf' ? (
            // Use iframe for PDFs
            <iframe
              key={iframeKey}
              src={getFileUrl()}
              width={width}
              height={height}
              className={loading ? 'hidden' : ''}
              onLoad={handleLoad}
              onError={handleError}
              style={{ border: 'none' }}
            />
          ) : (
            // Use img for images
            <div className={loading ? 'hidden' : ''} style={{ maxHeight: height, overflow: 'auto' }}>
              <img
                src={getFileUrl()}
                alt="Document preview"
                className="max-w-full"
                onLoad={handleLoad}
                onError={handleError}
              />
            </div>
          )}
          
          {showDownloadButton && !loading && !error && (
            <div className="mt-2">
              <SimpleFileDownloader 
                fileId={fileId} 
                buttonVariant="outline"
                className="w-full"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SimpleDocumentViewer; 