'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DocumentViewer } from '@/components/ui/DocumentViewer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function DocumentViewerTestPage() {
  const [fileId, setFileId] = useState('f17dba62-3384-47a0-b9a0-26b1bde731cf')
  const [inputValue, setInputValue] = useState('f17dba62-3384-47a0-b9a0-26b1bde731cf')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setFileId(inputValue)
  }
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Document Viewer Test</CardTitle>
          <CardDescription>
            Enter a file ID to test the document viewer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
            <Input 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter file ID..."
              className="flex-1"
            />
            <Button type="submit">Load Document</Button>
          </form>
          
          <div className="mt-6">
            <p className="text-sm text-muted-foreground mb-2">
              Currently viewing file ID: <code className="bg-muted px-1 py-0.5 rounded">{fileId}</code>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="h-[600px]">
        {fileId ? (
          <DocumentViewer fileId={fileId} />
        ) : (
          <div className="flex items-center justify-center h-full bg-muted rounded-md">
            <p className="text-muted-foreground">Enter a file ID above to view a document</p>
          </div>
        )}
      </div>
    </div>
  )
} 