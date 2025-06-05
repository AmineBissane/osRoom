"use client"

import ActivityDebugForm from '@/components/activity-debug-form'
import ActivityFormExample from '@/components/activity-form-example'
import ArrayTestForm from '@/components/array-test-form'
import ActivitySolutionDocs from '@/components/activity-solution-docs'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"

export default function TestActivityPage() {
  return (
    <div className="container py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Test Activity Creation</h1>
        <p className="text-muted-foreground">Use these forms to debug activity creation</p>
      </div>
      
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800">Solution Found!</AlertTitle>
        <AlertDescription className="text-green-700">
          The issue has been solved! When using FormData, you need to send classroomsIds as a JSON string array using JSON.stringify().
          See the documentation below for details.
        </AlertDescription>
      </Alert>
      
      <ActivitySolutionDocs />
      
      <div>
        <h2 className="text-xl font-semibold mb-4">Standard Form (Working Solution)</h2>
        <p className="text-muted-foreground mb-4">This form now works correctly with the backend API</p>
        <ActivityFormExample />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">Array Format Tests</h2>
          <p className="text-muted-foreground mb-4">Tests multiple ways to send classroomsIds as an array</p>
          <ArrayTestForm />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Debug Form</h2>
          <p className="text-muted-foreground mb-4">Advanced debugging with multiple methods</p>
          <ActivityDebugForm />
        </div>
      </div>
    </div>
  )
} 