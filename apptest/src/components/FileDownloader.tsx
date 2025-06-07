import React from 'react';
import SimpleFileDownloader from './SimpleFileDownloader';

interface FileDownloaderProps {
  fileId: string;
  fileName?: string;
  className?: string;
  buttonText?: string;
}

/**
 * Legacy FileDownloader component that now uses SimpleFileDownloader internally
 * @deprecated Use SimpleFileDownloader directly for new code
 */
export default function FileDownloader({ 
  fileId, 
  fileName = "document", 
  className = "", 
  buttonText = "Descargar archivo" 
}: FileDownloaderProps) {
  // Simply use our new SimpleFileDownloader component
  return (
    <SimpleFileDownloader
      fileId={fileId}
      fileName={fileName}
      className={className}
      buttonText={buttonText}
    />
  );
} 