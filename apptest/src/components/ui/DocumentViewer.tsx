'use client'

import React, { useState } from 'react'
import { 
  Card, 
  CardContent 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Download, 
  FileIcon, 
  AlertCircle
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
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(true)
  
  // Direct download function - most reliable approach
  const handleDownload = () => {
    // Create the download URL
    const downloadUrl = `/api/direct-document/${fileId}?preview=false`
    
    // Open it in a new tab/window for the download
    window.open(downloadUrl, '_blank')
  }
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-4">
        {showDownloadPrompt ? (
          <div className="flex flex-col items-center justify-center h-full w-full p-4" style={{height}}>
            <AlertCircle className="h-16 w-16 mb-6 text-orange-500" />
            <h3 className="text-xl font-medium mb-2 text-center">
              No se puede previsualizar el documento
            </h3>
            <p className="text-center text-muted-foreground mb-6 max-w-md">
              Para garantizar la mejor experiencia, es recomendable descargar el documento para verlo en su aplicación nativa.
            </p>
            <div className="flex gap-2">
              <Button variant="default" size="lg" onClick={handleDownload}>
                <Download className="h-5 w-5 mr-2" />
                Descargar documento
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full p-4" style={{height}}>
            <FileIcon className="h-16 w-16 mb-6 text-primary" />
            <h3 className="text-xl font-medium mb-2 text-center">
              Documento listo para descargar
            </h3>
            <p className="text-center text-muted-foreground mb-6 max-w-md">
              El documento está listo para ser descargado. Haga clic en el botón de descarga para obtener el archivo.
            </p>
            <div className="flex gap-2">
              <Button variant="default" size="lg" onClick={handleDownload}>
                <Download className="h-5 w-5 mr-2" />
                Descargar ahora
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 