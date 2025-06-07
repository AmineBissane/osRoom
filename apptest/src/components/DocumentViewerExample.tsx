'use client';

import React, { useState } from 'react';
import SimpleDocumentViewer from './SimpleDocumentViewer';
import SimpleFileDownloader from './SimpleFileDownloader';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const DocumentViewerExample: React.FC = () => {
  // Example file ID - you would get this from your API or props
  const [fileId, setFileId] = useState('f17dba62-3384-47a0-b9a0-26b1bde731cf');
  const [inputFileId, setInputFileId] = useState(fileId);
  const [viewerType, setViewerType] = useState<'auto' | 'pdf' | 'image'>('auto');

  const handleViewFile = () => {
    setFileId(inputFileId);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Simple Document Viewer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              value={inputFileId}
              onChange={(e) => setInputFileId(e.target.value)}
              placeholder="Enter file ID"
              className="flex-1"
            />
            <Button onClick={handleViewFile}>View Document</Button>
          </div>
          
          <div className="mb-4">
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  value="auto" 
                  checked={viewerType === 'auto'} 
                  onChange={() => setViewerType('auto')}
                />
                <span>Auto-detect</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  value="pdf" 
                  checked={viewerType === 'pdf'} 
                  onChange={() => setViewerType('pdf')}
                />
                <span>Force PDF</span>
              </label>
              <label className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  value="image" 
                  checked={viewerType === 'image'} 
                  onChange={() => setViewerType('image')}
                />
                <span>Force Image</span>
              </label>
            </div>
          </div>
          
          <div className="text-sm text-gray-500 mb-4">
            Current file ID: {fileId}
          </div>
          
          {/* The SimpleDocumentViewer component */}
          <div className="border rounded-md overflow-hidden">
            <SimpleDocumentViewer
              fileId={fileId}
              height="500px"
              width="100%"
              forceFileType={viewerType === 'auto' ? undefined : viewerType}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">SimpleDocumentViewer</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
{`import SimpleDocumentViewer from '@/components/SimpleDocumentViewer';

// In your component:
<SimpleDocumentViewer
  fileId="your-file-id-here"
  height="500px"           // optional, default is 600px
  width="100%"             // optional, default is 100%
  className=""             // optional, additional CSS classes
  showDownloadButton={true} // optional, default is true
  forceFileType="pdf"      // optional, forces display as PDF or image
/>`}
            </pre>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">SimpleFileDownloader</h3>
            <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
{`import SimpleFileDownloader from '@/components/SimpleFileDownloader';

// In your component:
<SimpleFileDownloader
  fileId="your-file-id-here"
  fileName="document"       // optional, default is undefined
  buttonText="Download File" // optional, default is "Download File"
  buttonVariant="default"   // optional, any button variant
  className=""              // optional, additional CSS classes
/>`}
            </pre>
            
            <div className="mt-4">
              <SimpleFileDownloader 
                fileId={fileId}
                buttonText="Download Current File" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentViewerExample; 