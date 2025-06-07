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
  const [fileUrl, setFileUrl] = useState<string>('');
  const [iframeKey, setIframeKey] = useState<number>(Date.now());

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

  // Fetch the file content and create a blob URL for secure viewing
  useEffect(() => {
    const fetchFile = async () => {
      if (!fileId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `/api/simple-file/${fileId}?preview=true&t=${timestamp}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        setFileUrl(blobUrl);
        setLoading(false);
        // Generate a new key for the iframe to force refresh
        setIframeKey(Date.now());
      } catch (err) {
        console.error('Error loading file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setLoading(false);
      }
    };
    
    fetchFile();
    
    // Cleanup function to revoke object URL
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
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
          {fileUrl && (
            fileType === 'pdf' ? (
              <iframe
                key={iframeKey}
                src={fileUrl}
                width={width}
                height={height}
                className={loading ? 'hidden' : ''}
                onLoad={handleLoad}
                onError={handleError}
                style={{ border: 'none' }}
              />
            ) : (
              <img
                src={fileUrl}
                alt="Document preview"
                className={`max-w-full ${loading ? 'hidden' : ''}`}
                style={{ maxHeight: height }}
                onLoad={handleLoad}
                onError={handleError}
              />
            )
          )}
          
          {showDownloadButton && !loading && !error && fileUrl && (
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