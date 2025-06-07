'use client';

import React, { useState } from 'react';
import { DocumentViewer } from '@/components/ui/DocumentViewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocumentPreviewTestPage() {
  const [fileId, setFileId] = useState('f17dba62-3384-47a0-b9a0-26b1bde731cf');
  const [inputFileId, setInputFileId] = useState(fileId);
  
  // Create the URLs for the document
  const externalUrl = `http://82.29.168.17:8030/api/v1/file-storage/download/${fileId}?preview=true`;
  const proxyUrl = `/api/direct-external-document/${fileId}?preview=true`;

  const handleViewDocument = () => {
    setFileId(inputFileId);
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Document Preview Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={inputFileId}
              onChange={(e) => setInputFileId(e.target.value)}
              placeholder="Enter file ID"
              className="flex-1"
            />
            <Button onClick={handleViewDocument}>View Document</Button>
          </div>
          
          <div className="text-sm text-gray-500 mb-2">
            <strong>File ID:</strong> {fileId}
          </div>
          
          <div className="text-xs text-gray-400 mb-4">
            <div><strong>External URL:</strong> {externalUrl}</div>
            <div><strong>Proxy URL:</strong> {proxyUrl}</div>
          </div>
        </CardContent>
      </Card>
      
      <DocumentViewer
        fileId={fileId}
        externalUrl={externalUrl}
        proxyUrl={proxyUrl}
        height="700px"
      />
    </div>
  );
} 