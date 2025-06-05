"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Cookies from 'js-cookie'
import config from '@/config'

export default function ActivityFormExample() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [endDate, setEndDate] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null);

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

      // Create form data - using the format that works with the test endpoint
      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('endDate', endDate)
      
      // Add classroomsIds as a JSON string array
      formData.append('classroomsIds', JSON.stringify([2]))
      
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

      // Send directly to the backend API using form-data
      console.log('Sending request to backend API');
      const response = await fetch('http://localhost:8222/api/v1/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do NOT set Content-Type - browser will set it with boundary for form-data
        },
        body: formData
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorText = '';
        try {
          // Try to get JSON error message
          const errorData = await response.json();
          console.error('Error response:', errorData);
          errorText = JSON.stringify(errorData);
        } catch (e) {
          // If not JSON, get as text
          errorText = await response.text();
        }
        console.error('Error creating activity:', errorText);
        toast.error(`Failed to create activity: ${response.status} - ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('Created activity:', data);
      toast.success('Activity created successfully!');
      
      // Reset form
      setName('')
      setDescription('')
      setEndDate('')
      setFile(null)
      
    } catch (error) {
      console.error('Error creating activity:', error)
      toast.error('Failed to create activity')
    } finally {
      setIsLoading(false)
    }
  }

  // Function to test the form data with our local test endpoint
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('endDate', endDate);
      formData.append('classroomsIds', JSON.stringify([1]));
      
      if (file) {
        formData.append('file', file);
      }
      
      // Send to our test endpoint
      const response = await fetch('/api/test-activity', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      console.log('Test response:', data);
      setTestResult(data);
      toast.success('Test completed - check console for details');
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Test failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to test multiple formats with our comprehensive test endpoint
  const handleAdvancedTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Get the JWT token
      const token = Cookies.get('access_token');
      if (!token) {
        toast.error('No authentication token found');
        return;
      }
      
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('endDate', endDate);
      formData.append('classroomsIds', "2");
      formData.append('classroomIds', "2");
      
      if (file) {
        formData.append('file', file);
      }
      
      // Send to our advanced test endpoint
      const response = await fetch('/api/test-form-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      console.log('Advanced test response:', data);
      setTestResult(data);
      toast.success('Advanced test completed - check console for details');
    } catch (error) {
      console.error('Advanced test error:', error);
      toast.error('Advanced test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Activity</CardTitle>
        <CardDescription>
          Fill out the form to create a new activity
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
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
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
              {isLoading ? 'Creating...' : 'Create Activity'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={handleTestSubmit}
              disabled={isLoading}
            >
              Test with Local Endpoint
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              className="w-full"
              onClick={handleAdvancedTest}
              disabled={isLoading}
            >
              Try Multiple Format Tests
            </Button>
          </div>
        </form>
        
        {testResult && (
          <div className="mt-4 p-3 bg-gray-50 border rounded-md">
            <h3 className="text-sm font-medium mb-2">Test Results</h3>
            <pre className="text-xs overflow-auto max-h-40 p-2 bg-black text-white rounded">
              {JSON.stringify(testResult, null, 2)}
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