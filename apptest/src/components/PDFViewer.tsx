import { useState, useEffect, useRef } from 'react';

interface PDFViewerProps {
  fileUrl: string;
  height?: string;
  width?: string;
}

export default function PDFViewer({ fileUrl, height = '600px', width = '100%' }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const objectRef = useRef<HTMLObjectElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [useIframe, setUseIframe] = useState(false);

  // Add a timestamp to prevent caching
  const urlWithTimestamp = fileUrl.includes('?') 
    ? `${fileUrl}&t=${new Date().getTime()}` 
    : `${fileUrl}?t=${new Date().getTime()}`;

  useEffect(() => {
    // Check if the URL is valid
    if (!fileUrl) {
      setError('No file URL provided');
      setLoading(false);
      return;
    }

    // Set a timeout to handle cases where the PDF might not load
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('PDF loading timed out, trying iframe fallback');
        // Try iframe as fallback if object tag is still loading
        setUseIframe(true);
        
        // Give iframe a chance to load before showing error
        const iframeTimeout = setTimeout(() => {
          if (loading) {
            setError('PDF loading timed out. Please try opening in a new tab.');
            setLoading(false);
          }
        }, 5000);
        
        return () => clearTimeout(iframeTimeout);
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
    };
  }, [fileUrl, loading]);

  const handleLoad = () => {
    console.log('PDF loaded successfully');
    setLoading(false);
  };

  const handleError = () => {
    console.error('Failed to load PDF');
    if (!useIframe) {
      // Try iframe as fallback
      setUseIframe(true);
    } else {
      setError('Failed to load PDF. Please try opening in a new tab.');
      setLoading(false);
    }
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center bg-gray-100 p-4" style={{ height }}>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={openInNewTab}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Abrir en nueva pestaña
        </button>
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
      
      {useIframe ? (
        <iframe
          ref={iframeRef}
          src={urlWithTimestamp}
          style={{ width: '100%', height: '100%', border: 'none' }}
          onLoad={handleLoad}
          onError={handleError}
          title="PDF Viewer"
          sandbox="allow-same-origin allow-scripts"
        />
      ) : (
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
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
            <p className="mb-4">Su navegador no puede mostrar el PDF.</p>
            <button 
              onClick={openInNewTab}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Abrir PDF
            </button>
          </div>
        </object>
      )}
      
      {/* Fallback button always available */}
      <div className="absolute bottom-4 right-4">
        <button 
          onClick={openInNewTab}
          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 opacity-80 hover:opacity-100"
        >
          Abrir en nueva pestaña
        </button>
      </div>
    </div>
  );
} 