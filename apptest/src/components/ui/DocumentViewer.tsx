'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Card, 
  CardContent 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  FileIcon, 
  AlertCircle,
  ExternalLink,
  Loader2,
  RefreshCw
} from "lucide-react"

interface DocumentViewerProps {
  fileId: string
  className?: string
  hideControls?: boolean
  height?: string | number
  width?: string | number
  externalUrl?: string
  proxyUrl?: string
}

export function DocumentViewer({ 
  fileId, 
  className = '', 
  hideControls = false,
  height = '600px',
  width = '100%',
  externalUrl,
  proxyUrl
}: DocumentViewerProps) {
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useProxyFallback, setUseProxyFallback] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  
  // Direct download function - most reliable approach
  const handleDownload = () => {
    // Create the download URL (prefer proxy URL for downloads)
    const downloadUrl = proxyUrl?.replace('preview=true', 'preview=false') || 
                       `/api/direct-document/${fileId}?preview=false`
    
    // Open it in a new tab/window for the download
    window.open(downloadUrl, '_blank')
  }
  
  // Function to open the document in a new tab
  const openInNewTab = () => {
    // Prefer proxy URL for opening in new tab to avoid CORS issues
    const url = proxyUrl || externalUrl || `/api/direct-document/${fileId}?preview=true`
    window.open(url, '_blank')
  }
  
  // Handle iframe load error
  const handleIframeError = () => {
    console.error('Error loading document in iframe')
    
    // If we're using external URL and proxy is available, try switching to proxy
    if (!useProxyFallback && proxyUrl && externalUrl) {
      console.log('Switching to proxy URL as fallback')
      setUseProxyFallback(true)
      setLoading(true)
      return
    }
    
    // If proxy also failed or not available, show download prompt
    setLoading(false)
    setError('No se pudo cargar la vista previa del documento')
    setShowDownloadPrompt(true)
  }
  
  // Handle iframe load success
  const handleIframeLoad = () => {
    // Check if the iframe loaded correctly
    try {
      // Try to access iframe content to see if it loaded properly
      const iframeDoc = iframeRef.current?.contentDocument || 
                        iframeRef.current?.contentWindow?.document
      
      // If we can't access the document due to CORS, switch to proxy
      if (!iframeDoc && !useProxyFallback && proxyUrl) {
        console.log('Cannot access iframe content, switching to proxy URL')
        setUseProxyFallback(true)
        return
      }
      
      setLoading(false)
    } catch (error) {
      // This catch will run if there's a CORS error when trying to access iframe content
      console.error('Error accessing iframe content:', error)
      
      // Try proxy fallback if available
      if (!useProxyFallback && proxyUrl) {
        console.log('CORS error accessing iframe content, switching to proxy URL')
        setUseProxyFallback(true)
        return
      }
      
      // If already using proxy or no proxy available, show error
      setLoading(false)
      setError('Error al cargar el documento debido a restricciones de seguridad')
      setShowDownloadPrompt(true)
    }
  }
  
  // Try again with proxy URL
  const handleRetry = () => {
    setLoading(true)
    setError(null)
    setShowDownloadPrompt(false)
    setUseProxyFallback(true)
  }
  
  useEffect(() => {
    // Reset states when fileId, externalUrl or proxyUrl changes
    setLoading(true)
    setError(null)
    setShowDownloadPrompt(false)
    setUseProxyFallback(false)
  }, [fileId, externalUrl, proxyUrl])
  
  // Choose the source URL for preview
  const previewUrl = useProxyFallback 
    ? proxyUrl
    : externalUrl || `/api/direct-document/${fileId}?preview=true`
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {showDownloadPrompt ? (
          <div className="flex flex-col items-center justify-center h-full w-full p-4" style={{height}}>
            <AlertCircle className="h-16 w-16 mb-6 text-orange-500" />
            <h3 className="text-xl font-medium mb-2 text-center">
              No se puede previsualizar el documento
            </h3>
            <p className="text-center text-muted-foreground mb-6 max-w-md">
              {error || 'Para garantizar la mejor experiencia, es recomendable descargar el documento para verlo en su aplicación nativa.'}
            </p>
            <div className="flex gap-2 flex-wrap justify-center">
              {!useProxyFallback && proxyUrl && (
                <Button variant="default" onClick={handleRetry}>
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Intentar nuevamente
                </Button>
              )}
              <Button variant="default" onClick={handleDownload}>
                <Download className="h-5 w-5 mr-2" />
                Descargar documento
              </Button>
              <Button variant="outline" onClick={openInNewTab}>
                <ExternalLink className="h-5 w-5 mr-2" />
                Abrir en nueva pestaña
              </Button>
            </div>
          </div>
        ) : (
          <div style={{height, width, position: 'relative'}}>
            <iframe 
              ref={iframeRef}
              src={previewUrl}
              style={{height: '100%', width: '100%', border: 'none'}}
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-same-origin allow-scripts"
            />
            
            {!hideControls && !loading && !error && (
              <div className="absolute bottom-4 right-4 flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
                <Button variant="outline" size="sm" onClick={openInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Nueva pestaña
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 