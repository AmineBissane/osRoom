import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, XCircle, FileText, Eye, Loader2 } from 'lucide-react';

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
  const [approach, setApproach] = useState<'blob' | 'iframe' | 'direct' | 'buttons'>('blob');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [isNonViewableFile, setIsNonViewableFile] = useState(false);
  const [fileTypeName, setFileTypeName] = useState<string>("archivo");
  
  // Lista de extensiones de archivo que no se pueden visualizar
  const nonViewableExtensions = useMemo(() => [
    '.zip', '.rar', '.7z', '.tar', '.gz', '.exe', '.msi', 
    '.jar', '.war', '.ear', '.bin', '.iso', '.dmg', '.pkg',
    '.apk', '.app', '.bat', '.cmd', '.sh'
  ], []);
  
  // Función para comprobar si un archivo es no visualizable por su extensión
  const isNonViewableExtension = useCallback((filename: string) => {
    const lowerFilename = filename.toLowerCase();
    return nonViewableExtensions.some(ext => lowerFilename.endsWith(ext));
  }, [nonViewableExtensions]);
  
  // Función para obtener el tipo de archivo a partir de su nombre
  const getFileTypeFromName = useCallback((filename: string) => {
    const lowerFilename = filename.toLowerCase();
    
    if (lowerFilename.endsWith('.zip')) return "ZIP";
    if (lowerFilename.endsWith('.rar')) return "RAR";
    if (lowerFilename.endsWith('.7z')) return "7-Zip";
    if (lowerFilename.endsWith('.tar') || lowerFilename.endsWith('.gz')) return "TAR";
    if (lowerFilename.endsWith('.exe') || lowerFilename.endsWith('.msi')) return "ejecutable";
    if (lowerFilename.endsWith('.jar') || lowerFilename.endsWith('.war')) return "Java";
    
    // Extraer la extensión del archivo
    const extension = lowerFilename.split('.').pop();
    return extension ? extension.toUpperCase() : "archivo";
  }, []);

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
      const url = `/api/proxy/file-storage/download/${fileId}?preview=true&t=${timestamp}`;
      
      console.log('Fetching file using blob approach:', url);
      
      // Check if the file is non-viewable first
      if (typeof fileId === 'string') {
        // Intentar extraer el nombre del archivo del fileId
        const possibleFileName = fileId.split('/').pop() || fileId;
        
        // Si el fileId contiene una extensión no visualizable
        if (isNonViewableExtension(possibleFileName)) {
          setFileName(possibleFileName);
          setFileTypeName(getFileTypeFromName(possibleFileName));
          setIsNonViewableFile(true);
          setLoading(false);
          setApproach('buttons');
          return false;
        }
      }
      
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
      
      // Get the content type and file name
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const contentDisposition = response.headers.get('content-disposition');
      setFileType(contentType);
      
      // Extract filename from content-disposition if available
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          const extractedName = filenameMatch[1];
          setFileName(extractedName);
          
          if (isNonViewableExtension(extractedName)) {
            setFileTypeName(getFileTypeFromName(extractedName));
            setIsNonViewableFile(true);
            setLoading(false);
            setApproach('buttons');
            return false;
          }
        }
      }
      
      // Check if it's a non-viewable MIME type
      const nonViewableMimeTypes = [
        'application/zip', 'application/x-zip-compressed', 'application/x-rar-compressed',
        'application/octet-stream', 'application/x-msdownload', 'application/x-executable',
        'application/java-archive'
      ];
      
      if (nonViewableMimeTypes.some(mime => contentType.includes(mime))) {
        if (!fileName) {
          const inferredName = fileId.split('/').pop() || 'archivo';
          setFileName(inferredName);
          setFileTypeName(contentType.split('/').pop() || 'archivo');
        }
        setIsNonViewableFile(true);
        setLoading(false);
        setApproach('buttons');
        return false;
      }
      
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
      
      if (isNonViewableFile) {
        // No need to try other approaches for non-viewable files
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
              setApproach('buttons');
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
  }, [fileId, loading, isNonViewableFile]);

  // Handle reload attempts
  const reloadFile = async () => {
    // Reset state
    setLoading(true);
    setError(null);
    setRetryCount(prev => prev + 1);
    
    if (approach === 'blob' || approach === 'buttons') {
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
  
  // Special view for non-viewable files (ZIP, executable, etc.)
  if (isNonViewableFile) {
    return (
      <div className="flex flex-col space-y-4">
        <div className="flex justify-center">
          <Button 
            variant="outline"
            className="w-full sm:w-auto"
            onClick={downloadFile}
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar archivo {fileTypeName}
          </Button>
        </div>
        
        <div className="w-full border rounded-md p-6 bg-gray-50 flex flex-col items-center justify-center" style={{ height }}>
          <div className="bg-blue-50 rounded-full p-4 mb-4">
            <FileText className="h-12 w-12 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium mb-2">{fileName || `Archivo ${fileTypeName}`}</h3>
          <p className="text-muted-foreground text-center mb-4">
            Los archivos {fileTypeName} no se pueden previsualizar. Haga clic en el botón de descarga para obtener el archivo.
          </p>
        </div>
      </div>
    );
  }

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
              <Loader2 className="h-4 w-4 mr-2" />
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
                <ExternalLink className="h-4 w-4 mr-2" />
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
          <iframe
            src={objectUrl}
            width="100%"
            height="100%"
            className="border-0"
            title="PDF Viewer"
          />
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
      
      // For other file types, use iframe as fallback
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
          onError={() => {
            setError('Failed to load file in iframe');
            setApproach('buttons');
          }}
        />
      );
    }
    
    // Buttons-only approach
    if (approach === 'buttons') {
      return (
        <div className="flex flex-col items-center justify-center p-4 h-full">
          <div className="flex flex-col items-center mb-8">
            <FileText className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center mb-4">
              La vista previa no está disponible. Utilice los botones para abrir o descargar el archivo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button onClick={reloadFile} variant="default">
              <Loader2 className="h-4 w-4 mr-2" />
              Intentar vista previa
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
              <Button onClick={openDirectLink} variant="default">
                <ExternalLink className="h-4 w-4 mr-2" />
                Enlace directo
              </Button>
            )}
          </div>
        </div>
      );
    }
    
    // Fallback
    return <div className="text-gray-500 p-4">No se pudo cargar el archivo. Intente usar los botones de abajo.</div>;
  };

  return (
    <div className="relative" style={{ width, height }}>
      {renderContent()}
      
      {showControls && !loading && !error && approach !== 'buttons' && (
        <div className="absolute bottom-4 right-4 flex flex-wrap gap-2">
          <Button onClick={reloadFile} variant="ghost" size="sm" className="opacity-80 hover:opacity-100">
            <Loader2 className="h-4 w-4 mr-1" />
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
              <ExternalLink className="h-4 w-4 mr-1" />
              Directo
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 