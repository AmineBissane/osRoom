"use client"

import ActivityFormExample from '@/components/activity-form-example'

export default function ActivityExamplePage() {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Create New Activity Example</h1>
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h2 className="text-lg font-semibold text-yellow-800 mb-2">Important: Direct Backend Request</h2>
        <p className="text-yellow-700">
          This form sends requests <strong>directly</strong> to the backend API at <code className="bg-yellow-100 px-1 rounded">http://localhost:8222/api/v1/activities</code> 
          instead of using the Next.js API routes.
        </p>
        <p className="text-yellow-700 mt-2">
          The issue with the API route is that the JWT token is too large, causing a <strong>431 Request Header Fields Too Large</strong> error.
        </p>
      </div>
      <ActivityFormExample />
    </div>
  )
} 