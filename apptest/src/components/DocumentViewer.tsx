import { useState, useEffect, useRef } from 'react';
import { Download, Eye, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  fileUrl: string;
  fileName?: string;
}

export default function DocumentViewer({ fileUrl, fileName = "Documento" }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleLoad = () => {
    setLoading(false);
    
    // Add event listener to the iframe to prevent keyboard events from bubbling up
    if (iframeRef.current) {
      const iframe = iframeRef.current;
      
      // Try to access iframe content and add event listeners
      try {
        // This will only work if the iframe content is from the same origin
        const iframeContent = iframe.contentDocument || iframe.contentWindow?.document;
        
        if (iframeContent) {
          iframeContent.addEventListener('keydown', (e) => {
            e.stopPropagation();
          }, true);
          
          iframeContent.addEventListener('keyup', (e) => {
            e.stopPropagation();
          }, true);
          
          iframeContent.addEventListener('keypress', (e) => {
            e.stopPropagation();
          }, true);
        }
      } catch (e) {
        console.log('Could not add event listeners to iframe content - likely a cross-origin issue');
      }
    }
  };

  // Add global keyboard event handler for the iframe container
  useEffect(() => {
    const preventKeyboardEvents = (e: KeyboardEvent) => {
      // Only prevent events when clicking inside the iframe container
      const isInsideViewer = e.target instanceof Node && 
        (document.querySelector('.document-viewer-container')?.contains(e.target));
      
      if (isInsideViewer) {
        e.stopPropagation();
      }
    };

    // Add event listeners to capture keyboard events
    document.addEventListener('keydown', preventKeyboardEvents, true);
    document.addEventListener('keyup', preventKeyboardEvents, true);
    document.addEventListener('keypress', preventKeyboardEvents, true);

    return () => {
      // Clean up event listeners
      document.removeEventListener('keydown', preventKeyboardEvents, true);
      document.removeEventListener('keyup', preventKeyboardEvents, true);
      document.removeEventListener('keypress', preventKeyboardEvents, true);
    };
  }, []);

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  const downloadFile = () => {
    window.open(fileUrl, '_blank');
  };

  // Determine document type
  const getDocumentType = () => {
    if (fileUrl.includes('.pdf')) return 'PDF';
    if (fileUrl.includes('.docx') || fileUrl.includes('.doc')) return 'Word';
    if (fileUrl.includes('.xlsx') || fileUrl.includes('.xls')) return 'Excel';
    if (fileUrl.includes('.jpg') || fileUrl.includes('.jpeg') || 
        fileUrl.includes('.png') || fileUrl.includes('.gif')) return 'Image';
    return 'Documento';
  };

  return (
    <div className="flex flex-col h-full document-viewer-container">
      <div className="flex justify-between items-center mb-4">
        <div className="font-medium">{fileName || `${getDocumentType()}`}</div>
        <Button variant="outline" size="sm" onClick={downloadFile}>
          <Download className="h-4 w-4 mr-1" />
          Descargar
        </Button>
      </div>
      
      <div className="relative flex-grow bg-gray-100 rounded-md overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 p-4">
            <XCircle className="h-12 w-12 text-red-500 mb-2" />
            <p className="text-center">No se puede visualizar este documento. Intente descargarlo para verlo.</p>
            <Button variant="outline" className="mt-4" onClick={downloadFile}>
              <Download className="h-4 w-4 mr-1" />
              Descargar
            </Button>
          </div>
        ) : (
          <iframe 
            ref={iframeRef}
            src={fileUrl}
            className="w-full h-full border-0"
            onLoad={handleLoad}
            onError={handleError}
            title="Vista previa de documento"
            sandbox="allow-same-origin allow-scripts allow-forms"
          />
        )}
      </div>
    </div>
  );
}