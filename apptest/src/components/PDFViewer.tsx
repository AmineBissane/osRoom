import { useState, useEffect, useRef } from 'react';

interface PDFViewerProps {
  fileUrl: string;
  height?: string;
  width?: string;
}

export default function PDFViewer({ fileUrl, height = '600px', width = '100%' }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<'object' | 'iframe' | 'embed' | 'failed'>('object');
  const objectRef = useRef<HTMLObjectElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const embedRef = useRef<HTMLEmbedElement>(null);

  // Add a timestamp to prevent caching
  const urlWithTimestamp = fileUrl.includes('?') 
    ? `${fileUrl}&nocache=${new Date().getTime()}` 
    : `${fileUrl}?nocache=${new Date().getTime()}`;

  useEffect(() => {
    // Check if the URL is valid
    if (!fileUrl) {
      setError('No file URL provided');
      setLoading(false);
      return;
    }

    // Reset state when URL changes
    setLoading(true);
    setError(null);
    setViewerType('object');

    // Set a timeout to try different approaches
    const objectTimeout = setTimeout(() => {
      if (loading) {
        console.log('Object tag timeout, trying iframe');
        setViewerType('iframe');
        
        // Give iframe a chance to load
        const iframeTimeout = setTimeout(() => {
          if (loading) {
            console.log('Iframe timeout, trying embed');
            setViewerType('embed');
            
            // Give embed a chance to load
            const embedTimeout = setTimeout(() => {
              if (loading) {
                console.log('All viewers failed');
                setError('PDF loading timed out. Please try opening in a new tab.');
                setViewerType('failed');
                setLoading(false);
              }
            }, 5000);
            
            return () => clearTimeout(embedTimeout);
          }
        }, 5000);
        
        return () => clearTimeout(iframeTimeout);
      }
    }, 5000);

    return () => {
      clearTimeout(objectTimeout);
    };
  }, [fileUrl, loading]);

  const handleLoad = () => {
    console.log(`PDF loaded successfully using ${viewerType}`);
    setLoading(false);
  };

  const handleError = () => {
    console.error(`Failed to load PDF using ${viewerType}`);
    if (viewerType === 'object') {
      setViewerType('iframe');
    } else if (viewerType === 'iframe') {
      setViewerType('embed');
    } else {
      setError('Failed to load PDF. Please try opening in a new tab.');
      setViewerType('failed');
      setLoading(false);
    }
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  const downloadFile = () => {
    // Create a direct download link
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (viewerType === 'failed' || error) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 p-4" style={{ height }}>
        <p className="text-red-500 mb-4">{error || 'No se pudo cargar el PDF'}</p>
        <div className="flex space-x-4">
          <button 
            onClick={openInNewTab}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Abrir en nueva pestaña
          </button>
          <button 
            onClick={downloadFile}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Descargar PDF
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pdf-viewer-container" style={{ width, height, position: 'relative' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      )}
      
      {viewerType === 'object' && (
        <object
          ref={objectRef}
          data={urlWithTimestamp}
          type="application/pdf"
          width={width}
          height={height}
          className="border-0"
          onLoad={handleLoad}
          onError={handleError}
        >
          <p>Su navegador no puede mostrar el PDF.</p>
        </object>
      )}
      
      {viewerType === 'iframe' && (
        <iframe
          ref={iframeRef}
          src={urlWithTimestamp}
          style={{ width: '100%', height: '100%', border: 'none' }}
          onLoad={handleLoad}
          onError={handleError}
          title="PDF Viewer"
          sandbox="allow-same-origin allow-scripts"
        />
      )}
      
      {viewerType === 'embed' && (
        <embed
          ref={embedRef}
          src={urlWithTimestamp}
          type="application/pdf"
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {/* Fallback buttons always available */}
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button 
          onClick={openInNewTab}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 opacity-80 hover:opacity-100"
        >
          Abrir
        </button>
        <button 
          onClick={downloadFile}
          className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600 opacity-80 hover:opacity-100"
        >
          Descargar
        </button>
      </div>
    </div>
  );
} 