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
  // Always use the proxy URL by default since we know the external URL has CORS issues
  const [useProxyFallback, setUseProxyFallback] = useState(true)
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
    
    // If proxy failed, show download prompt
    setLoading(false)
    setError('No se pudo cargar la vista previa del documento')
    setShowDownloadPrompt(true)
  }
  
  // Handle iframe load success
  const handleIframeLoad = () => {
    // Simply mark as loaded since we're using the proxy URL
    setLoading(false)
  }
  
  // Try again with external URL in new tab
  const openExternalDirectly = () => {
    if (externalUrl) {
      window.open(externalUrl, '_blank')
    }
  }
  
  useEffect(() => {
    // Reset states when fileId, externalUrl or proxyUrl changes
    setLoading(true)
    setError(null)
    setShowDownloadPrompt(false)
    // Always use proxy
    setUseProxyFallback(true)
  }, [fileId, externalUrl, proxyUrl])
  
  // Choose the source URL for preview - always use proxy
  const previewUrl = proxyUrl || `/api/direct-document/${fileId}?preview=true`
  
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
              <Button variant="default" onClick={handleDownload}>
                <Download className="h-5 w-5 mr-2" />
                Descargar documento
              </Button>
              {externalUrl && (
                <Button variant="outline" onClick={openExternalDirectly}>
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Ver en servidor externo
                </Button>
              )}
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