'use client';

import React, { useState, useRef } from 'react';
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
  const formRef = useRef<HTMLFormElement>(null);

  const downloadFile = () => {
    if (!fileId) {
      setError('No file ID provided');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Submit the form to trigger download
      if (formRef.current) {
        formRef.current.submit();
      }
      
      // Reset loading state after a short delay
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(err instanceof Error ? err.message : 'Error downloading file');
      setLoading(false);
    }
  };

  // Create a unique form ID for this instance
  const formId = `download-form-${fileId}`;

  return (
    <div className={className}>
      {/* Hidden form for download */}
      <form
        ref={formRef}
        id={formId}
        action={`/api/simple-file/${fileId}`}
        method="GET"
        target="_blank"
        style={{ display: 'none' }}
      >
        <input type="hidden" name="preview" value="false" />
        <input type="hidden" name="t" value={Date.now().toString()} />
      </form>
      
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