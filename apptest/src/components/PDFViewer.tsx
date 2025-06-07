import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, RefreshCcw } from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  height?: string;
  width?: string;
  showControls?: boolean;
}

export default function PDFViewer({ 
  fileUrl, 
  height = '600px', 
  width = '100%',
  showControls = true 
}: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const objectRef = useRef<HTMLObjectElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Add timestamp to URL to prevent caching
  const getUrlWithTimestamp = (url: string) => {
    const timestamp = new Date().getTime();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${timestamp}`;
  };

  // Handle reload button click
  const handleReload = () => {
    setLoading(true);
    
    // Force reload by recreating the object tag
    if (objectRef.current) {
      const parent = objectRef.current.parentElement;
      if (parent) {
        const newObject = document.createElement('object');
        newObject.setAttribute('data', getUrlWithTimestamp(fileUrl));
        newObject.setAttribute('type', 'application/pdf');
        newObject.setAttribute('width', '100%');
        newObject.setAttribute('height', '100%');
        newObject.className = 'border-0';
        
        // Add fallback content
        const fallback = document.createElement('p');
        fallback.textContent = 'Your browser does not support PDFs. ';
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        link.rel = 'noreferrer';
        link.textContent = 'Click here to view the PDF';
        fallback.appendChild(link);
        newObject.appendChild(fallback);
        
        // Replace the old object with the new one
        parent.replaceChild(newObject, objectRef.current);
        objectRef.current = newObject as HTMLObjectElement;
      }
    }
    
    // Reset loading state after a short delay
    setTimeout(() => setLoading(false), 1000);
  };

  // Open in new tab
  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  // Download file
  const downloadFile = () => {
    // Change preview=true to preview=false to trigger download
    const downloadUrl = fileUrl.replace('preview=true', 'preview=false');
    window.open(downloadUrl, '_blank');
  };

  // Monitor loading state
  useEffect(() => {
    const checkLoading = () => {
      if (objectRef.current) {
        setLoading(false);
      }
    };
    
    // Set timeout to check loading state
    const timeout = setTimeout(() => {
      if (loading) {
        setError('PDF may be taking too long to load. Try reloading or opening in a new tab.');
        setLoading(false);
      }
    }, 10000); // 10 second timeout
    
    // Try to detect when PDF is loaded
    window.addEventListener('load', checkLoading);
    
    return () => {
      window.removeEventListener('load', checkLoading);
      clearTimeout(timeout);
    };
  }, [loading, fileUrl]);

  return (
    <div className="relative" style={{ width, height }}>
      {/* PDF Viewer */}
      <div className="w-full h-full">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {error && (
          <div className="flex flex-col items-center justify-center p-4 h-full">
            <p className="text-red-500 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={handleReload} variant="default">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Reload
              </Button>
              <Button onClick={openInNewTab} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </Button>
            </div>
          </div>
        )}
        
        <object
          ref={objectRef}
          data={getUrlWithTimestamp(fileUrl)}
          type="application/pdf"
          width="100%"
          height="100%"
          className="border-0"
          onLoad={() => setLoading(false)}
          onError={() => setError('Failed to load PDF')}
        >
          <p>
            Your browser does not support PDFs.
            <a href={fileUrl} target="_blank" rel="noreferrer">Click here to view the PDF</a>
          </p>
        </object>
      </div>
      
      {/* Controls */}
      {showControls && !loading && !error && (
        <div className="absolute bottom-4 right-4 flex gap-2">
          <Button onClick={handleReload} variant="ghost" size="sm" className="opacity-80 hover:opacity-100">
            <RefreshCcw className="h-4 w-4 mr-1" />
            Reload
          </Button>
          <Button onClick={openInNewTab} variant="default" size="sm" className="opacity-80 hover:opacity-100">
            <ExternalLink className="h-4 w-4 mr-1" />
            Open
          </Button>
          <Button onClick={downloadFile} variant="outline" size="sm" className="opacity-80 hover:opacity-100">
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
} 