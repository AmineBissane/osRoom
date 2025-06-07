'use client';

import React from 'react';
import DocumentViewerExample from '@/components/DocumentViewerExample';
import SimpleDocumentViewer from '@/components/SimpleDocumentViewer';
import SimpleFileDownloader from '@/components/SimpleFileDownloader';

export default function TestDocumentViewerPage() {
  // Direct example with the specified file ID from the user's query
  const exampleFileId = 'f17dba62-3384-47a0-b9a0-26b1bde731cf';
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Document Viewer Test Page</h1>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
        <h2 className="text-xl font-semibold mb-2">Direct Example</h2>
        <p className="mb-4">This is a direct example using the file ID: <code className="bg-blue-100 px-2 py-1 rounded">{exampleFileId}</code></p>
        
        <div className="border bg-white rounded-md overflow-hidden shadow-sm">
          <SimpleDocumentViewer fileId={exampleFileId} height="400px" />
        </div>
        
        <div className="mt-4">
          <SimpleFileDownloader fileId={exampleFileId} buttonText="Download This File" />
        </div>
      </div>
      
      <DocumentViewerExample />
    </div>
  );
}