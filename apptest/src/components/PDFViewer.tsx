import { useState, useEffect } from 'react';

interface PDFViewerProps {
  fileUrl: string;
  height?: string;
  width?: string;
}

export default function PDFViewer({ fileUrl, height = '600px', width = '100%' }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError('PDF loading timed out. Please try opening in a new tab.');
        setLoading(false);
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
    };
  }, [fileUrl, loading]);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setError('Failed to load PDF. Please try opening in a new tab.');
    setLoading(false);
  };

  const openInNewTab = () => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="pdf-viewer-container" style={{ width, height, position: 'relative' }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
        </div>
      )}
      
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={openInNewTab}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Open in New Tab
          </button>
        </div>
      ) : (
        <object
          data={fileUrl}
          type="application/pdf"
          width={width}
          height={height}
          className="border-0"
          onLoad={handleLoad}
          onError={handleError}
        >
          <div className="flex flex-col items-center justify-center h-full bg-gray-100 p-4">
            <p className="mb-4">Your browser does not support PDF preview.</p>
            <button 
              onClick={openInNewTab}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Open PDF
            </button>
          </div>
        </object>
      )}
    </div>
  );
} 