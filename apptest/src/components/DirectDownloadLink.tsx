'use client';

import React from 'react';
import { Button } from './ui/button';
import { Download } from 'lucide-react';

interface DirectDownloadLinkProps {
  fileId?: string;
  className?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const DirectDownloadLink: React.FC<DirectDownloadLinkProps> = ({
  fileId = 'f17dba62-3384-47a0-b9a0-26b1bde731cf',
  className = '',
  buttonText = 'Direct Download',
  buttonVariant = 'default',
}) => {
  // This is a super simple component that just links directly to the example URL
  const directUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=false`;
  
  return (
    <div className={className}>
      <a href={directUrl} target="_blank" rel="noopener noreferrer">
        <Button variant={buttonVariant} className={className}>
          <Download className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </a>
      <p className="text-xs text-gray-500 mt-1">
        Note: You may need to be logged in to access this file directly.
      </p>
    </div>
  );
};

export default DirectDownloadLink; 