"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ActivitySolutionDocs() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Activity Creation Solution</CardTitle>
        <CardDescription>
          How to properly send classroomsIds to the backend API
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="formdata">
          <TabsList className="mb-4">
            <TabsTrigger value="formdata">FormData Solution</TabsTrigger>
            <TabsTrigger value="json">JSON Solution</TabsTrigger>
            <TabsTrigger value="explanation">Explanation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="formdata" className="space-y-4">
            <h3 className="text-lg font-medium">FormData Solution</h3>
            <p className="text-sm text-muted-foreground mb-4">
              When using FormData to create activities, you must send classroomsIds as a JSON string array:
            </p>
            
            <pre className="p-4 bg-gray-50 rounded-md overflow-auto text-sm">
{`// Create FormData
const formData = new FormData();
formData.append('name', 'Activity Name');
formData.append('description', 'Activity Description');
formData.append('endDate', '2024-06-15T14:30:00');

// This is the key part - send classroomsIds as a JSON string array
formData.append('classroomsIds', JSON.stringify([2]));

// Add file if needed
if (file) {
  formData.append('file', file);
}

// Send the request
const response = await fetch('http://82.29.168.17:8222/api/v1/activities', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`
    // Do NOT set Content-Type - browser will set it with boundary
  },
  body: formData
});`}
            </pre>
          </TabsContent>
          
          <TabsContent value="json" className="space-y-4">
            <h3 className="text-lg font-medium">JSON Solution</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Alternatively, you can use JSON format which may be cleaner for some use cases:
            </p>
            
            <pre className="p-4 bg-gray-50 rounded-md overflow-auto text-sm">
{`// Create JSON payload
const payload = {
  name: 'Activity Name',
  description: 'Activity Description',
  endDate: '2024-06-15T14:30:00',
  classroomsIds: [2] // Direct array of integers
};

// Send the request
const response = await fetch('http://82.29.168.17:8222/api/v1/activities', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});

// Note: Using JSON approach doesn't support file uploads directly
// For files, you would need to use FormData or a separate file upload endpoint`}
            </pre>
          </TabsContent>
          
          <TabsContent value="explanation" className="space-y-4">
            <h3 className="text-lg font-medium">Explanation</h3>
            <p className="text-sm text-muted-foreground">
              The problem with the activity creation was related to how the classroomsIds field was being sent:
            </p>
            
            <ul className="list-disc pl-5 space-y-2 text-sm mt-2">
              <li>
                <strong>The issue:</strong> The backend API expected classroomsIds to be an array of integers,
                but we were sending it as a simple string "2".
              </li>
              <li>
                <strong>FormData challenge:</strong> FormData normally sends everything as strings, but the 
                backend expects complex objects like arrays to be properly formatted.
              </li>
              <li>
                <strong>Solution:</strong> Convert the array to a JSON string using JSON.stringify() so the
                backend can properly parse it back into an array.
              </li>
              <li>
                <strong>Alternative:</strong> Use JSON format instead of FormData, which naturally handles
                arrays and objects correctly, but doesn't directly support file uploads.
              </li>
            </ul>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> When working with form data and complex objects (arrays, nested objects),
                always use JSON.stringify() to ensure proper transmission. The backend framework will then
                parse this JSON string back into the proper data structure.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
} 