'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Card, 
  CardContent 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  ExternalLink, 
  RefreshCw, 
  FileIcon, 
  AlertCircle,
  Loader2
} from "lucide-react"

interface DocumentViewerProps {
  fileId: string
  className?: string
  hideControls?: boolean
  height?: string | number
  width?: string | number
}

export function DocumentViewer({ 
  fileId, 
  className = '', 
  hideControls = false,
  height = '600px',
  width = '100%'
}: DocumentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [docUrl, setDocUrl] = useState<string>('')
  const [retryCount, setRetryCount] = useState(0)
  const [docType, setDocType] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const directUrl = `http://82.29.168.17:8222/api/v1/file-storage/download/${fileId}?preview=true`
  
  // Helper to get JWT token from cookies
  const getToken = () => {
    if (typeof document === 'undefined') return null
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('access_token='))
      ?.split('=')[1] || null
  }
  
  // Get proxy URL to avoid CORS issues
  const getProxyUrl = (preview: boolean = true) => {
    return `/api/direct-document/${fileId}?preview=${preview}`
  }

  // Ensure we're making a proper GET request for the document
  const forceGetRequest = async (url: string) => {
    try {
      const token = getToken()
      if (!token) {
        throw new Error('No authentication token found')
      }
      
      console.log('Making forced GET request to:', url)
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store',
          'Accept': '*/*'
        },
        cache: 'no-store',
        mode: 'cors',
        credentials: 'same-origin'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const contentType = response.headers.get('content-type')
      if (contentType) {
        setDocType(contentType)
        console.log('Document content type:', contentType)
      }
      
      const contentDisposition = response.headers.get('content-disposition')
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch && filenameMatch[1]) {
          setFileName(filenameMatch[1])
        }
      }
      
      return response
    } catch (error) {
      console.error('Error making GET request:', error)
      throw error
    }
  }
  
  // Handle opening in new tab
  const handleOpenInNewTab = () => {
    window.open(getProxyUrl(true), '_blank')
  }
  
  // Handle download
  const handleDownload = () => {
    const url = getProxyUrl(false)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || `file-${fileId.substring(0, 8)}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  
  // Handle retry
  const handleRetry = () => {
    setLoading(true)
    setError(null)
    setRetryCount(prev => prev + 1)
  }
  
  // Direct document embedding
  useEffect(() => {
    const loadDocument = async () => {
      if (!fileId) {
        setError('No file ID provided')
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        
        // Use our proxy URL to avoid CORS issues
        const proxyUrl = getProxyUrl(true)
        
        // Force a GET request to the server to ensure content is loaded
        await forceGetRequest(proxyUrl)
        
        // Set the URL after confirming the resource is available
        setDocUrl(proxyUrl)
        
        // We'll let the iframe handle the actual display
        console.log('Document ready for display:', proxyUrl)
      } catch (err) {
        console.error('Error loading document:', err)
        setError('Connection error. Please download the file or try again later.')
      } finally {
        // The iframe onLoad will set loading to false when content is ready
      }
    }
    
    loadDocument()
  }, [fileId, retryCount])
  
  // Set up a timeout to handle hanging loads
  useEffect(() => {
    if (!loading) return
    
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Document load timeout reached')
        
        // Check if the iframe has content before showing error
        const iframe = iframeRef.current
        if (iframe) {
          try {
            const hasContent = Boolean(
              iframe.contentWindow && 
              iframe.contentWindow.document && 
              iframe.contentWindow.document.body && 
              iframe.contentWindow.document.body.innerHTML
            )
            
            if (hasContent) {
              console.log('Content detected in iframe despite timeout')
              setLoading(false)
              return
            }
          } catch (e) {
            console.log('Cannot access iframe content:', e)
          }
        }
        
        setError('Connection error. Please download the file or try again later.')
        setLoading(false)
      }
    }, 10000) // Reduced to 10 second timeout for faster error feedback
    
    return () => clearTimeout(timeout)
  }, [loading])
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      {!hideControls && (
        <div className="flex flex-wrap gap-2 justify-center p-2 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenInNewTab}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open in New Tab
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      )}
      
      <CardContent className="p-0 h-full">
        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center h-full w-full p-4" style={{height}}>
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
            <p className="text-center text-muted-foreground">Loading document...</p>
          </div>
        )}
        
        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center h-full w-full p-4" style={{height}}>
            <AlertCircle className="h-10 w-10 mb-4 text-destructive" />
            <p className="text-center font-medium mb-2 text-destructive">Error al cargar el documento</p>
            <p className="text-center text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button variant="default" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        )}
        
        {/* Document viewer */}
        <div 
          className={`h-full w-full transition-opacity duration-300 ${loading || error ? 'opacity-0 hidden' : 'opacity-100'}`}
          style={{height}}
        >
          {/* Hidden link to ensure GET request is made */}
          <div style={{ display: 'none' }}>
            <a 
              href={docUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              ref={(el) => {
                if (el && retryCount > 0) {
                  console.log('Auto-clicking link to force GET request')
                  el.click()
                  // Stop it from actually opening
                  setTimeout(() => {
                    try { window.stop() } catch (e) {}
                  }, 100)
                }
              }}
            >
              Force GET
            </a>
          </div>
          
          {docUrl && (
            <iframe
              ref={iframeRef}
              key={`doc-viewer-${fileId}-${retryCount}`}
              src={docUrl}
              className="w-full h-full border-0"
              style={{width, height}}
              onLoad={() => {
                console.log('Document iframe loaded')
                setLoading(false)
              }}
              onError={(e) => {
                console.error('Document iframe error:', e)
                setError('Error de conexión. Por favor descargue el archivo o intente más tarde.')
                setLoading(false)
              }}
            />
          )}
        </div>
      </CardContent>
    </Card>
  )
} 