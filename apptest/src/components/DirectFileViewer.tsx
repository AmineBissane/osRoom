import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

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
  const [directUrl, setDirectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setError('No file ID provided');
      setLoading(false);
      return;
    }

    // Generate the direct view URL with timestamp to prevent caching
    const timestamp = new Date().getTime();
    const url = `/api/proxy/file-storage/direct-view/${fileId}?preview=true&t=${timestamp}`;
    setDirectUrl(url);

    // Set a timeout to detect loading issues
    const timeout = setTimeout(() => {
      if (loading) {
        setError('Loading timed out. Try opening in a new tab.');
        setLoading(false);
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [fileId, loading]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError('Failed to load file. Try opening in a new tab.');
    setLoading(false);
  };

  const openInNewTab = () => {
    if (directUrl) {
      window.open(directUrl, '_blank');
    }
  };

  const downloadFile = () => {
    if (fileId) {
      const downloadUrl = `/api/proxy/file-storage/download/${fileId}?preview=false&t=${new Date().getTime()}`;
      window.open(downloadUrl, '_blank');
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 p-4" style={{ height }}>
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
        </div>
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      )}

      {directUrl && (
        <iframe
          src={directUrl}
          width="100%"
          height="100%"
          className="border-0"
          onLoad={handleLoad}
          onError={handleError}
          title="File Viewer"
          sandbox="allow-same-origin allow-scripts"
        />
      )}

      {showControls && (
        <div className="absolute bottom-4 right-4 flex space-x-2">
          <Button onClick={openInNewTab} variant="default" size="sm" className="opacity-80 hover:opacity-100">
            <ExternalLink className="h-4 w-4 mr-1" />
            Abrir
          </Button>
          <Button onClick={downloadFile} variant="outline" size="sm" className="opacity-80 hover:opacity-100">
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
        </div>
      )}
    </div>
  );
} 