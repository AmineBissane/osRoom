'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface BrowserDownloadLinkProps {
  fileId?: string;
  className?: string;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
}

const BrowserDownloadLink: React.FC<BrowserDownloadLinkProps> = ({
  fileId = 'f17dba62-3384-47a0-b9a0-26b1bde731cf',
  className = '',
  buttonText = 'Postman-Style Download',
  buttonVariant = 'default',
}) => {
  const [token, setToken] = useState<string | null>(null);
  
  // Extract token from cookies on component mount
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('access_token='));
    if (tokenCookie) {
      setToken(tokenCookie.split('=')[1]);
    }
  }, []);

  const handleClick = () => {
    if (!token) {
      alert('No authentication token found. Please log in first.');
      return;
    }
    
    // Create a temporary link element
    const link = document.createElement('a');
    
    // Set the href to the backend URL
    const url = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=false`;
    link.href = url;
    
    // Open in a new tab
    link.target = '_blank';
    
    // Create a temporary div to hold the link and some instructions
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.color = 'white';
    container.style.padding = '20px';
    container.style.boxSizing = 'border-box';
    
    // Add instructions
    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <h2 style="text-align:center;margin-bottom:20px">Manual Authentication Needed</h2>
      <p style="text-align:center;margin-bottom:10px">A new tab will open. If prompted for authentication, please paste this token:</p>
      <div style="background:#333;padding:10px;border-radius:4px;margin-bottom:20px;word-break:break-all;font-family:monospace;max-width:600px;overflow-x:auto">
        <strong>Bearer ${token}</strong>
        <button id="copy-token-btn" style="background:#4a90e2;border:none;color:white;padding:5px 10px;border-radius:4px;cursor:pointer;margin-left:10px">Copy</button>
      </div>
      <p style="text-align:center;margin-bottom:20px">You may need to paste this into an Authorization header or login form.</p>
      <button id="continue-btn" style="background:#4a90e2;border:none;color:white;padding:10px 20px;border-radius:4px;cursor:pointer;font-size:16px">Continue to Download</button>
      <button id="cancel-btn" style="background:#666;border:none;color:white;padding:10px 20px;border-radius:4px;cursor:pointer;margin-top:10px;font-size:16px">Cancel</button>
    `;
    container.appendChild(instructions);
    
    // Add to body
    document.body.appendChild(container);
    
    // Add event listeners
    document.getElementById('copy-token-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(`Bearer ${token}`);
      alert('Token copied to clipboard!');
    });
    
    document.getElementById('continue-btn')?.addEventListener('click', () => {
      document.body.removeChild(container);
      window.open(url, '_blank');
    });
    
    document.getElementById('cancel-btn')?.addEventListener('click', () => {
      document.body.removeChild(container);
    });
  };
  
  return (
    <div className={className}>
      <Button 
        variant={buttonVariant} 
        className={className}
        onClick={handleClick}
      >
        <ExternalLink className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
      <p className="text-xs text-gray-500 mt-1">
        Opens direct backend link with auth help
      </p>
    </div>
  );
};

export default BrowserDownloadLink; 