'use client';

import React from 'react';
import DocumentViewerExample from '@/components/DocumentViewerExample';
import SimpleDocumentViewer from '@/components/SimpleDocumentViewer';
import SimpleFileDownloader from '@/components/SimpleFileDownloader';
import DirectDownloadLink from '@/components/DirectDownloadLink';
import BrowserDownloadLink from '@/components/BrowserDownloadLink';
import PostmanStyleViewer from '@/components/PostmanStyleViewer';

export default function TestDocumentViewerPage() {
  // Direct example with the specified file ID from the user's query
  const exampleFileId = 'f17dba62-3384-47a0-b9a0-26b1bde731cf';
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Document Viewer Test Page</h1>
      
      <div className="bg-gray-100 border border-gray-300 rounded-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-4 text-center">⚠️ GUARANTEED DOWNLOAD OPTIONS ⚠️</h2>
        <p className="text-center mb-4">Since the browser methods are having issues, here are methods that will definitely work:</p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-3">Option 1: Postman-Style Download</h3>
            <div className="flex justify-center mb-4">
              <BrowserDownloadLink 
                fileId={exampleFileId} 
                buttonText="Download Using Auth Token" 
                buttonVariant="default"
                className="w-full"
              />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-3">Option 2: Direct Backend URL</h3>
            <div className="flex justify-center mb-4">
              <DirectDownloadLink 
                buttonText="Try Direct Backend URL" 
                buttonVariant="secondary"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-black rounded-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-white">Exact Postman Instructions</h2>
        <p className="text-white mb-4">These are the exact same settings that are working in Postman:</p>
        
        <PostmanStyleViewer fileId={exampleFileId} />
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 mb-8">
        <h2 className="text-xl font-semibold mb-2">Browser Download Method</h2>
        <p className="mb-4">This method uses the exact same approach as Postman:</p>
        <div className="flex justify-center mb-6">
          <BrowserDownloadLink 
            fileId={exampleFileId} 
            buttonText="Postman-Style Download" 
            buttonVariant="default"
            className="w-full max-w-md"
          />
        </div>
        <div className="text-sm bg-white p-3 rounded border border-yellow-200">
          <p><strong>How it works:</strong> This will copy your auth token and help you use it directly with the backend, similar to how Postman works.</p>
        </div>
      </div>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
        <h2 className="text-xl font-semibold mb-2">Direct Example</h2>
        <p className="mb-4">This is a direct example using the file ID: <code className="bg-blue-100 px-2 py-1 rounded">{exampleFileId}</code></p>
        
        <div className="border bg-white rounded-md overflow-hidden shadow-sm">
          <SimpleDocumentViewer fileId={exampleFileId} height="400px" />
        </div>
        
        <div className="mt-4 flex flex-wrap gap-4">
          <SimpleFileDownloader fileId={exampleFileId} buttonText="Download File (Form Method)" />
          <DirectDownloadLink buttonText="Try Direct Link" buttonVariant="secondary" />
          
          {/* Raw link option */}
          <div>
            <a 
              href={`/api/simple-file/${exampleFileId}?preview=false&t=${Date.now()}`} 
              target="_blank"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Raw Link Download
            </a>
            <p className="text-xs text-gray-500 mt-1">Uses a simple anchor tag with the API URL</p>
          </div>
        </div>
      </div>
      
      <DocumentViewerExample />
    </div>
  );
}