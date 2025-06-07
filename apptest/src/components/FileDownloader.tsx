import { useState } from 'react';

interface FileDownloaderProps {
  fileId: string;
  fileName?: string;
  className?: string;
  buttonText?: string;
}

export default function FileDownloader({ 
  fileId, 
  fileName = "document", 
  className = "", 
  buttonText = "Descargar archivo" 
}: FileDownloaderProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const downloadFile = async () => {
    if (!fileId) {
      setError('No se proporcionó un ID de archivo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const url = `/api/proxy/file-storage/download/${fileId}?preview=false&t=${timestamp}`;
      
      // Open in a new tab
      window.open(url, '_blank');
      
      setLoading(false);
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Error al descargar el archivo');
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={downloadFile}
        disabled={loading}
        className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <span className="flex items-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Descargando...
          </span>
        ) : (
          buttonText
        )}
      </button>
      
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
} 