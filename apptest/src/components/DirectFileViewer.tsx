import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Link2, RefreshCcw } from 'lucide-react';

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
  const [directLink, setDirectLink] = useState<{url: string, token: string, directAccessUrl?: string} | null>(null);
  const [approach, setApproach] = useState<'blob' | 'iframe' | 'direct'>('blob');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const objectRef = useRef<HTMLObjectElement>(null);

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
        token: data.token,
        directAccessUrl: data.directAccessUrl
      });
      
      return data;
    } catch (err) {
      console.error('Error fetching direct link:', err);
      return null;
    }
  };

  // Function to load the file content using blob approach
  const loadFileBlob = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generate URL with timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/api/proxy/file-storage/direct-view/${fileId}?preview=true&t=${timestamp}`;
      
      console.log('Fetching file using blob approach:', url);
      
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
      
      return true;
    } catch (err) {
      console.error('Error in blob approach:', err);
      return false;
    }
  };

  // Main effect to load the file
  useEffect(() => {
    if (!fileId) {
      setError('No file ID provided');
      setLoading(false);
      return;
    }
    
    const loadFile = async () => {
      // Step 1: Try the blob approach first
      setApproach('blob');
      const blobSuccess = await loadFileBlob();
      
      if (blobSuccess) {
        // Also fetch direct link as fallback
        await fetchDirectLink();
        return;
      }
      
      // Step 2: If blob failed, switch to iframe approach
      setApproach('iframe');
      setLoading(true);
      
      // Generate a direct URL to the file
      const timestamp = new Date().getTime();
      const iframeSrc = `/api/proxy/file-storage/download/${fileId}?preview=true&t=${timestamp}`;
      setObjectUrl(iframeSrc);
      
      // Give iframe a chance to load
      setTimeout(() => {
        if (loading) {
          // Try to get direct link as final fallback
          fetchDirectLink().then(link => {
            if (link) {
              setApproach('direct');
              setError('Try opening the file directly');
            } else {
              setError('Failed to load file. Try refreshing.');
            }
            setLoading(false);
          });
        }
      }, 5000);
    };

    loadFile();
    
    // Clean up blob URL when component unmounts
    return () => {
      if (objectUrl && approach === 'blob') {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  // Handle direct reload attempts
  const reloadFile = async () => {
    // Reset state
    setLoading(true);
    setError(null);
    
    if (approach === 'blob') {
      // Try iframe approach
      setApproach('iframe');
      const timestamp = new Date().getTime();
      const iframeSrc = `/api/proxy/file-storage/download/${fileId}?preview=true&t=${timestamp}`;
      setObjectUrl(iframeSrc);
      setTimeout(() => setLoading(false), 1000);
    } else {
      // Try blob approach again
      await loadFileBlob();
    }
  };

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
      // Use the direct access URL that handles the token for us
      if (directLink.directAccessUrl) {
        window.open(directLink.directAccessUrl, '_blank');
      } else {
        window.open(directLink.url, '_blank');
      }
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
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={reloadFile} variant="default">
              <RefreshCcw className="h-4 w-4 mr-2" />
              Intentar de nuevo
            </Button>
            <Button onClick={openInNewTab} variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Nueva pestaña
            </Button>
            <Button onClick={downloadFile} variant="secondary">
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            {directLink && (
              <Button onClick={openDirectLink} variant="destructive">
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
    
    // Approach 1: Using blob URL
    if (approach === 'blob') {
      // For images
      if (fileType?.startsWith('image/')) {
        return <img src={objectUrl} alt="Preview" className="max-w-full h-auto object-contain" />;
      }
      
      // For PDFs
      if (fileType === 'application/pdf' || objectUrl?.toLowerCase().endsWith('.pdf')) {
        return (
          <div className="w-full h-full">
            <object
              ref={objectRef}
              data={objectUrl}
              type="application/pdf"
              width="100%"
              height="100%"
              className="border-0"
            >
              <p>Your browser does not support PDFs. 
                <a href={objectUrl} target="_blank" rel="noreferrer">Click here to view the PDF</a>
              </p>
            </object>
          </div>
        );
      }
      
      // For audio files
      if (fileType?.startsWith('audio/')) {
        return (
          <div className="w-full flex flex-col items-center justify-center p-4">
            <audio controls className="w-full max-w-md">
              <source src={objectUrl} type={fileType} />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      }
      
      // For video files
      if (fileType?.startsWith('video/')) {
        return (
          <div className="w-full h-full flex items-center justify-center">
            <video 
              controls 
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: 'calc(100% - 20px)' }}
            >
              <source src={objectUrl} type={fileType} />
              Your browser does not support the video element.
            </video>
          </div>
        );
      }
      
      // For text files, JSON, CSV, etc.
      if (fileType?.startsWith('text/') || 
          fileType === 'application/json' || 
          fileType === 'application/csv' ||
          fileType === 'application/xml') {
        
        const [textContent, setTextContent] = useState<string | null>(null);
        
        useEffect(() => {
          const fetchTextContent = async () => {
            try {
              if (objectUrl) {
                const response = await fetch(objectUrl);
                const text = await response.text();
                setTextContent(text);
              }
            } catch (err) {
              console.error('Error fetching text content:', err);
            }
          };
          
          fetchTextContent();
          
          return () => {
            // Cleanup
          };
        }, [objectUrl]);
        
        return (
          <div className="w-full h-full overflow-auto">
            {textContent ? (
              <pre className="p-4 text-sm font-mono whitespace-pre-wrap bg-gray-50 border rounded h-full overflow-auto">
                {textContent}
              </pre>
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            )}
          </div>
        );
      }
      
      // For Office documents (Word, Excel, PowerPoint)
      if (fileType?.includes('officedocument') || 
          fileType?.includes('msword') || 
          fileType?.includes('ms-excel') ||
          fileType?.includes('ms-powerpoint')) {
        return (
          <div className="w-full h-full">
            <iframe
              ref={iframeRef}
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(window.location.origin + '/api/proxy/file-storage/download/' + fileId + '?preview=true')}`}
              width="100%"
              height="100%"
              className="border-0"
              title="Office Document Viewer"
            />
          </div>
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
    }
    
    // Approach 2: Using iframe with direct URL
    if (approach === 'iframe') {
      return (
        <iframe
          ref={iframeRef}
          src={objectUrl}
          width="100%"
          height="100%"
          className="border-0"
          title="File Viewer"
          sandbox="allow-same-origin allow-scripts"
          onLoad={() => setLoading(false)}
          onError={() => setError('Failed to load file in iframe')}
        />
      );
    }
    
    // Fallback
    return <div className="text-gray-500 p-4">No se pudo cargar el archivo. Intente usar los botones de abajo.</div>;
  };

  return (
    <div className="relative" style={{ width, height }}>
      {renderContent()}
      
      {showControls && !loading && !error && (
        <div className="absolute bottom-4 right-4 flex flex-wrap gap-2">
          <Button onClick={reloadFile} variant="ghost" size="sm" className="opacity-80 hover:opacity-100">
            <RefreshCcw className="h-4 w-4 mr-1" />
            Recargar
          </Button>
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