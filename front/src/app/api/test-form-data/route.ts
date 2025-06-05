import { NextRequest, NextResponse } from 'next/server';

// This is a specialized test endpoint to help debug form data issues
export async function POST(request: NextRequest) {
  try {
    // Check if request is form data
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    let formData;
    try {
      formData = await request.formData();
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Failed to parse form data',
        error: String(error)
      }, { status: 400 });
    }
    
    // Log all the form data entries
    console.log('Form data entries:');
    const formDataObj: Record<string, any> = {};
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        formDataObj[key] = {
          name: value.name,
          type: value.type,
          size: value.size
        };
        console.log(`${key}: [File] ${value.name}, type: ${value.type}, size: ${value.size}`);
      } else {
        formDataObj[key] = value;
        console.log(`${key}: ${value}`);
      }
    }
    
    // Get the token from the request headers
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'No authorization token provided'
      }, { status: 401 });
    }
    
    // Now try different format combinations to the backend
    const testResults = [];
    
    // 1. Try with classroomsIds as a string
    try {
      const newFormData = new FormData();
      newFormData.append('name', formData.get('name') as string);
      newFormData.append('description', formData.get('description') as string);
      newFormData.append('endDate', formData.get('endDate') as string);
      newFormData.append('classroomsIds', formData.get('classroomsIds') as string);
      
      if (formData.has('file')) {
        newFormData.append('file', formData.get('file') as File);
      }
      
      const response = await fetch('http://localhost:8222/api/v1/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: newFormData
      });
      
      testResults.push({
        format: 'classroomsIds as string',
        status: response.status,
        success: response.ok,
        response: response.ok ? await response.json() : await response.text()
      });
    } catch (error) {
      testResults.push({
        format: 'classroomsIds as string',
        error: String(error)
      });
    }
    
    // 2. Try with classroomIds (singular) as a string
    try {
      const newFormData = new FormData();
      newFormData.append('name', formData.get('name') as string);
      newFormData.append('description', formData.get('description') as string);
      newFormData.append('endDate', formData.get('endDate') as string);
      newFormData.append('classroomIds', formData.get('classroomIds') as string);
      
      if (formData.has('file')) {
        newFormData.append('file', formData.get('file') as File);
      }
      
      const response = await fetch('http://localhost:8222/api/v1/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: newFormData
      });
      
      testResults.push({
        format: 'classroomIds (singular) as string',
        status: response.status,
        success: response.ok,
        response: response.ok ? await response.json() : await response.text()
      });
    } catch (error) {
      testResults.push({
        format: 'classroomIds (singular) as string',
        error: String(error)
      });
    }
    
    // 3. Try with classroomsIds as array notation in field name
    try {
      const newFormData = new FormData();
      newFormData.append('name', formData.get('name') as string);
      newFormData.append('description', formData.get('description') as string);
      newFormData.append('endDate', formData.get('endDate') as string);
      newFormData.append('classroomsIds[]', formData.get('classroomsIds') as string);
      
      if (formData.has('file')) {
        newFormData.append('file', formData.get('file') as File);
      }
      
      const response = await fetch('http://localhost:8222/api/v1/activities', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: newFormData
      });
      
      testResults.push({
        format: 'classroomsIds[] as string',
        status: response.status,
        success: response.ok,
        response: response.ok ? await response.json() : await response.text()
      });
    } catch (error) {
      testResults.push({
        format: 'classroomsIds[] as string',
        error: String(error)
      });
    }
    
    // Return all test results
    return NextResponse.json({
      success: true,
      message: 'Test completed',
      originalData: formDataObj,
      testResults
    });
  } catch (error) {
    console.error('Error in test-form-data endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 