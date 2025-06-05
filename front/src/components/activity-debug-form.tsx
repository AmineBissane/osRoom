"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Cookies from 'js-cookie'

export default function ActivityDebugForm() {
  const [name, setName] = useState('test')
  const [description, setDescription] = useState('description')
  const [endDate, setEndDate] = useState('2024-06-15T14:30:00')
  const [classroomId, setClassroomId] = useState('2')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Define a proper type for the response data
  type ResponseData = {
    jsonAttempt?: {
      status: number;
      data?: any;
      text?: string;
    };
    formDataAttempt?: {
      status: number;
      data?: any;
      text?: string;
      error?: string;
    };
    error?: string;
    debugResults?: {
      json?: any;
      formData?: any;
    };
  }
  
  const [responseData, setResponseData] = useState<ResponseData | null>(null)

  // This function tries to exactly match the Postman request that works
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Get the JWT token
      const token = Cookies.get('access_token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      // Try an alternative approach with JSON
      console.log('Trying with JSON payload...');
      
      // Send directly to the backend API using JSON
      const jsonResponse = await fetch('http://localhost:8222/api/v1/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          description: description,
          endDate: endDate,
          classroomsIds: [parseInt(classroomId)] // Send as a JSON array of integers
        })
      });
      
      console.log('JSON response status:', jsonResponse.status);
      
      let jsonResponseText = '';
      try {
        jsonResponseText = await jsonResponse.text();
        console.log('JSON response:', jsonResponseText);
        
        try {
          const jsonData = JSON.parse(jsonResponseText);
          setResponseData({
            jsonAttempt: {
              status: jsonResponse.status,
              data: jsonData
            }
          } as ResponseData);
          
          if (jsonResponse.ok) {
            toast.success('Activity created successfully with JSON!');
            return;
          }
        } catch (e) {
          // Not JSON
          setResponseData({
            jsonAttempt: {
              status: jsonResponse.status,
              text: jsonResponseText
            }
          } as ResponseData);
        }
      } catch (e) {
        console.error('Error reading JSON response:', e);
      }
      
      // If JSON approach failed, try with FormData
      console.log('Trying with FormData...');
      
      // Create form data - exactly matching the Postman request
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('endDate', endDate)
      
      // Try multiple formats for classroomsIds
      formData.append('classroomsIds', classroomId) // As a string - like in Postman
      
      // Add file if selected
      if (file) {
        formData.append('file', file)
      }

      // Log form data for debugging
      console.log('Form data being sent:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: [File] ${value.name}`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // Send the FormData request
      const response = await fetch('http://localhost:8222/api/v1/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do NOT set Content-Type - browser will set it with boundary for form-data
        },
        body: formData
      });

      console.log('FormData response status:', response.status);
      
      // Try to get the response data
      let responseText = '';
      try {
        responseText = await response.text();
        console.log('FormData response:', responseText);
        
        // Try to parse as JSON if possible
        try {
          const formDataResult = JSON.parse(responseText);
          setResponseData(prev => ({
            ...prev as ResponseData,
            formDataAttempt: {
              status: response.status,
              data: formDataResult
            }
          }));
        } catch (e) {
          // Not JSON, just set the text
          setResponseData(prev => ({
            ...prev as ResponseData,
            formDataAttempt: {
              status: response.status,
              text: responseText
            }
          }));
        }
      } catch (e) {
        setResponseData(prev => ({
          ...prev as ResponseData,
          formDataAttempt: {
            status: response.status,
            error: 'Could not read response'
          }
        }));
      }
      
      if (!response.ok) {
        console.error('Error creating activity with FormData:', responseText);
        toast.error(`Failed to create activity: ${response.status} - ${responseText}`);
        return;
      }

      toast.success('Activity created successfully with FormData!');
      
    } catch (error) {
      console.error('Error creating activity:', error)
      toast.error('Failed to create activity')
      setResponseData(prev => ({
        ...prev as ResponseData,
        error: String(error)
      }));
    } finally {
      setIsLoading(false)
    }
  }

  // Add a new function to test with our debug endpoint
  const handleDebugTest = async () => {
    setIsLoading(true);
    
    try {
      // Get the JWT token
      const token = Cookies.get('access_token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }
      
      // First try with JSON
      console.log('Testing JSON with debug endpoint...');
      const jsonResponse = await fetch('/api/debug-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: name,
          description: description,
          endDate: endDate,
          classroomsIds: [parseInt(classroomId)] // Send as array of integers
        })
      });
      
      if (jsonResponse.ok) {
        const jsonDebugData = await jsonResponse.json();
        console.log('JSON debug data:', jsonDebugData);
        
        setResponseData({
          debugResults: {
            json: jsonDebugData
          }
        } as ResponseData);
      }
      
      // Then try with FormData
      console.log('Testing FormData with debug endpoint...');
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('endDate', endDate);
      formData.append('classroomsIds', classroomId);
      
      // Also try adding it as JSON string
      formData.append('classroomsIdsJson', JSON.stringify([parseInt(classroomId)]));
      
      if (file) {
        formData.append('file', file);
      }
      
      const formDataResponse = await fetch('/api/debug-activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (formDataResponse.ok) {
        const formDebugData = await formDataResponse.json();
        console.log('FormData debug data:', formDebugData);
        
        setResponseData(prev => ({
          ...prev as ResponseData,
          debugResults: {
            ...(prev as ResponseData)?.debugResults,
            formData: formDebugData
          }
        }));
        
        toast.success('Debug tests completed. Check the results below.');
      }
    } catch (error) {
      console.error('Error during debug testing:', error);
      toast.error('Debug testing failed');
      
      setResponseData(prev => ({
        ...prev as ResponseData,
        error: String(error)
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Debug Activity Creation</CardTitle>
        <CardDescription>
          This form exactly matches the Postman request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <Input 
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Activity name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">Description</label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Activity description"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
            <Input 
              id="endDate"
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="2024-06-15T14:30:00"
              required
            />
            <p className="text-xs text-muted-foreground">Format: 2024-06-15T14:30:00</p>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="classroomId" className="text-sm font-medium">Classroom ID</label>
            <Input 
              id="classroomId"
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              placeholder="2"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="file" className="text-sm font-medium">File (optional)</label>
            <Input 
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          
          <div className="pt-4 space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Activity (Exact Postman Match)'}
            </Button>
            
            <Button 
              type="button" 
              variant="secondary"
              className="w-full" 
              onClick={handleDebugTest}
              disabled={isLoading}
            >
              Run Debug Tests
            </Button>
          </div>
        </form>
        
        {responseData && (
          <div className="mt-4 p-3 bg-gray-50 border rounded-md">
            <h3 className="text-sm font-medium mb-2">Response</h3>
            <pre className="text-xs overflow-auto max-h-40 p-2 bg-black text-white rounded">
              {JSON.stringify(responseData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between text-sm text-muted-foreground">
        <p className="text-red-500 font-semibold">Direct backend request to: http://localhost:8222/api/v1/activities</p>
      </CardFooter>
    </Card>
  )
} 