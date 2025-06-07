import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Link2 } from 'lucide-react';

interface DirectFileViewerProps {
  fileId: string;
  height?: string;
  width?: string;
  showControls?: boolean;
}

export default function DirectFileViewer({ 
  fileId, 
  height = '600px', 
  width = '100%',
  showControls = true
}: DirectFileViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [directLink, setDirectLink] = useState<{url: string, token: string} | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Function to fetch the direct link as fallback
  const fetchDirectLink = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/proxy/file-storage/file-link/${fileId}?preview=true&t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate direct link');
      }
      
      const data = await response.json();
      setDirectLink({
        url: data.url,
        token: data.token
      });
      
      return data;
    } catch (err) {
      console.error('Error fetching direct link:', err);
      return null;
    }
  };

  useEffect(() => {
    if (!fileId) {
      setError('No file ID provided');
      setLoading(false);
      return;
    }

    const fetchFile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Generate URL with timestamp to prevent caching
        const timestamp = new Date().getTime();
        const url = `/api/proxy/file-storage/download/${fileId}?preview=true&t=${timestamp}`;
        
        // Fetch the file data directly
        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.status}`);
        }
        
        // Get the content type
        const contentType = response.headers.get('content-type') || 'application/octet-stream';
        setFileType(contentType);
        
        // Create a blob URL for the content
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setObjectUrl(blobUrl);
        setLoading(false);
        
        // Also fetch the direct link as a fallback
        fetchDirectLink();
      } catch (err) {
        console.error('Error fetching file:', err);
        
        // Try to get direct link as fallback
        const linkData = await fetchDirectLink();
        if (linkData) {
          setError('Using direct link as fallback. Click "Abrir directo" to view.');
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load file');
        }
        
        setLoading(false);
      }
    };

    fetchFile();
    
    // Clean up blob URL when component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  const openInNewTab = () => {
    if (fileId) {
      const timestamp = new Date().getTime();
      window.open(`/api/proxy/file-storage/download/${fileId}?preview=true&t=${timestamp}`, '_blank');
    }
  };

  const downloadFile = () => {
    if (fileId) {
      const timestamp = new Date().getTime();
      const downloadUrl = `/api/proxy/file-storage/download/${fileId}?preview=false&t=${timestamp}`;
      window.open(downloadUrl, '_blank');
    }
  };
  
  const openDirectLink = () => {
    if (directLink) {
      // Create a form to submit the auth token with the request
      const form = document.createElement('form');
      form.method = 'GET';
      form.action = directLink.url;
      form.target = '_blank';
      
      // Add auth header as a hidden field
      const authField = document.createElement('input');
      authField.type = 'hidden';
      authField.name = 'Authorization';
      authField.value = directLink.token;
      form.appendChild(authField);
      
      // Submit the form
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center bg-gray-100 p-4 h-full">
          <p className="text-red-500 mb-4">{error}</p>
          <div className="flex space-x-4">
            <Button onClick={openInNewTab} variant="default">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir en nueva pestaña
            </Button>
            <Button onClick={downloadFile} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            {directLink && (
              <Button onClick={openDirectLink} variant="secondary">
                <Link2 className="h-4 w-4 mr-2" />
                Abrir directo
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    if (!objectUrl) {
      return <div className="text-gray-500 p-4">No hay contenido disponible</div>;
    }
    
    // For images
    if (fileType?.startsWith('image/')) {
      return <img src={objectUrl} alt="Preview" className="max-w-full h-auto object-contain" />;
    }
    
    // For PDFs
    if (fileType === 'application/pdf') {
      return (
        <object
          data={objectUrl}
          type="application/pdf"
          width="100%"
          height="100%"
          className="border-0"
        >
          <iframe
            ref={iframeRef}
            src={objectUrl}
            width="100%"
            height="100%"
            className="border-0"
            title="PDF Viewer"
          />
        </object>
      );
    }
    
    // For other file types
    return (
      <iframe
        ref={iframeRef}
        src={objectUrl}
        width="100%"
        height="100%"
        className="border-0"
        title="File Viewer"
      />
    );
  };

  return (
    <div className="relative" style={{ width, height }}>
      {renderContent()}
      
      {showControls && !loading && !error && (
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <Button onClick={openInNewTab} variant="default" size="sm" className="opacity-80 hover:opacity-100">
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir
          </Button>
          <Button onClick={downloadFile} variant="outline" size="sm" className="opacity-80 hover:opacity-100">
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
          {directLink && (
            <Button onClick={openDirectLink} variant="secondary" size="sm" className="opacity-80 hover:opacity-100">
              <Link2 className="h-4 w-4 mr-1" />
              Directo
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 