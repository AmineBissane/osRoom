'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Copy, Code, ExternalLink } from 'lucide-react';

interface PostmanStyleViewerProps {
  fileId?: string;
  className?: string;
}

interface PostmanConfig {
  url: string;
  method: string;
  headers: {
    Authorization: string;
    Accept: string;
  };
}

const PostmanStyleViewer: React.FC<PostmanStyleViewerProps> = ({
  fileId = 'f17dba62-3384-47a0-b9a0-26b1bde731cf',
  className = '',
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Extract token from cookies on component mount
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
    if (tokenCookie) {
      setToken(tokenCookie.split('=')[1]);
    }
  }, []);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
  };

  const getCurlCommand = () => {
    if (!token) return 'No authentication token found';
    
    return `curl -X GET "http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=false" \\
-H "Authorization: Bearer ${token}" \\
-H "Accept: */*" \\
--output "${fileId}.pdf"`;
  };

  const getPostmanInstructions = (): PostmanConfig | null => {
    if (!token) return null;
    
    return {
      url: `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=false`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': '*/*'
      }
    };
  };

  const postmanConfig = getPostmanInstructions();

  return (
    <div className={`p-4 bg-gray-900 text-white rounded-md ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2 flex items-center">
          <Code className="mr-2" /> CURL Command
        </h3>
        <div className="relative">
          <pre className="bg-black p-3 rounded-md overflow-x-auto whitespace-pre-wrap text-sm">
            {getCurlCommand()}
          </pre>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 h-8 w-8 p-0"
            onClick={() => copyToClipboard(getCurlCommand())}
          >
            <Copy className="h-4 w-4" />
            <span className="sr-only">Copy</span>
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Run this command in your terminal to download the file directly
        </p>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2 flex items-center">
          <ExternalLink className="mr-2" /> Postman Instructions
        </h3>
        <div className="bg-black p-3 rounded-md">
          {postmanConfig ? (
            <>
              <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                <div className="font-medium">URL:</div>
                <div className="col-span-2 break-all">
                  {postmanConfig.url}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                <div className="font-medium">Method:</div>
                <div className="col-span-2">
                  {postmanConfig.method}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm mb-4">
                <div className="font-medium">Headers:</div>
                <div className="col-span-2">
                  <div><strong>Authorization:</strong> Bearer {token ? `${token.substring(0, 15)}...` : 'None'}</div>
                  <div><strong>Accept:</strong> */*</div>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => copyToClipboard(JSON.stringify(postmanConfig, null, 2))}
              >
                {copied ? 'Copied!' : 'Copy Postman Configuration'}
              </Button>
            </>
          ) : (
            <div className="text-yellow-400 p-2">
              Authentication token required to generate Postman configuration
            </div>
          )}
        </div>
      </div>
      
      {!token && (
        <div className="bg-red-900 p-3 rounded-md text-sm">
          <p>⚠️ No authentication token found. Please log in first.</p>
        </div>
      )}
    </div>
  );
};

export default PostmanStyleViewer; 