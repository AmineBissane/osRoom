"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Cookies from 'js-cookie'

export default function ArrayTestForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [responseData, setResponseData] = useState<any>(null)

  // This function tries to solve the classroomsIds array issue
  const handleTestArrayFormats = async () => {
    setIsLoading(true)

    try {
      // Get the JWT token
      const token = Cookies.get('access_token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      // Create a fixed test payload - with only the required fields
      const testActivity = {
        name: 'Test Activity',
        description: 'Test Description',
        endDate: '2024-06-15T14:30:00'
      };
      
      // Try multiple array formats with JSON
      const jsonResults = [];
      
      // 1. Try with classroomsIds as an array of integers
      try {
        const response = await fetch('http://82.29.168.17:8222/api/v1/activities', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...testActivity,
            classroomsIds: [2] // Array with single integer
          })
        });
        
        jsonResults.push({
          format: 'classroomsIds: [2]',
          status: response.status,
          success: response.ok,
          response: response.ok ? await response.json() : await response.text()
        });
      } catch (error) {
        jsonResults.push({
          format: 'classroomsIds: [2]',
          error: String(error)
        });
      }
      
      // 2. Try with classroomIds (singular) as an array
      try {
        const response = await fetch('http://82.29.168.17:8222/api/v1/activities', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...testActivity,
            classroomIds: [2] // Array with singular name
          })
        });
        
        jsonResults.push({
          format: 'classroomIds: [2]',
          status: response.status,
          success: response.ok,
          response: response.ok ? await response.json() : await response.text()
        });
      } catch (error) {
        jsonResults.push({
          format: 'classroomIds: [2]',
          error: String(error)
        });
      }
      
      // Try FormData formats
      const formDataResults = [];
      
      // 1. Try with classroomsIds[] format 
      try {
        const formData = new FormData();
        formData.append('name', testActivity.name);
        formData.append('description', testActivity.description);
        formData.append('endDate', testActivity.endDate);
        formData.append('classroomsIds[]', '2'); // Array notation in field name
        
        const response = await fetch('http://82.29.168.17:8222/api/v1/activities', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        formDataResults.push({
          format: 'classroomsIds[]',
          status: response.status,
          success: response.ok,
          response: response.ok ? await response.json() : await response.text()
        });
      } catch (error) {
        formDataResults.push({
          format: 'classroomsIds[]',
          error: String(error)
        });
      }
      
      // 2. Try with JSON string for classroomsIds
      try {
        const formData = new FormData();
        formData.append('name', testActivity.name);
        formData.append('description', testActivity.description);
        formData.append('endDate', testActivity.endDate);
        formData.append('classroomsIds', JSON.stringify([2])); // JSON string
        
        const response = await fetch('http://82.29.168.17:8222/api/v1/activities', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        formDataResults.push({
          format: 'classroomsIds as JSON string',
          status: response.status,
          success: response.ok,
          response: response.ok ? await response.json() : await response.text()
        });
      } catch (error) {
        formDataResults.push({
          format: 'classroomsIds as JSON string',
          error: String(error)
        });
      }
      
      // Set all results
      setResponseData({
        jsonResults,
        formDataResults
      });
      
      toast.success('Array format tests completed. Check results below.');
      
    } catch (error) {
      console.error('Error testing array formats:', error)
      toast.error('Tests failed')
      setResponseData({ error: String(error) });
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Array Format Tests</CardTitle>
        <CardDescription>
          This will test multiple formats for sending classroomsIds as an array
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button
            onClick={handleTestArrayFormats}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Testing...' : 'Run Array Format Tests'}
          </Button>
          
          {responseData && (
            <div className="mt-4 p-3 bg-gray-50 border rounded-md">
              <h3 className="text-sm font-medium mb-2">Test Results</h3>
              <pre className="text-xs overflow-auto max-h-80 p-2 bg-black text-white rounded">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <p className="text-red-500 font-semibold">Tests classroomsIds array formats</p>
      </CardFooter>
    </Card>
  )
} 