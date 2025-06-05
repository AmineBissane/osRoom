import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get full request details
    const url = request.url;
    const method = request.method;
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Try to parse as form data first
    let formData: Record<string, any> = {};
    let parsedFormData = false;
    
    try {
      const fData = await request.formData();
      parsedFormData = true;
      
      for (const [key, value] of fData.entries()) {
        if (value instanceof File) {
          formData[key] = {
            name: value.name,
            type: value.type,
            size: value.size
          };
        } else {
          formData[key] = value;
        }
      }
    } catch (error) {
      console.error('Failed to parse form data:', error);
    }
    
    // Try to parse as JSON
    let jsonData = null;
    let parsedJson = false;
    
    try {
      // Clone the request before trying to read as JSON
      // since we may have already consumed the body as formData
      const clone = request.clone();
      jsonData = await clone.json();
      parsedJson = true;
    } catch (error) {
      console.error('Failed to parse JSON:', error);
    }
    
    // Try to read raw body as text
    let rawBody = null;
    try {
      // Clone again to get raw body
      const clone = request.clone();
      rawBody = await clone.text();
    } catch (error) {
      console.error('Failed to read raw body:', error);
    }
    
    // Now, let's validate what we have:
    const validationResults = {
      name: formData.name ? 'Valid' : 'Missing',
      description: formData.description ? 'Valid' : 'Missing',
      endDate: formData.endDate ? 'Valid' : 'Missing',
      classroomsIds: 'Unknown'
    };
    
    // Check classroomsIds formats
    if (formData.classroomsIds) {
      if (Array.isArray(formData.classroomsIds)) {
        validationResults.classroomsIds = 'Valid (array)';
      } else if (typeof formData.classroomsIds === 'string') {
        // Try to parse as array
        try {
          const parsed = JSON.parse(formData.classroomsIds);
          if (Array.isArray(parsed)) {
            validationResults.classroomsIds = 'Valid (string containing JSON array)';
          } else {
            validationResults.classroomsIds = 'Invalid (string containing non-array JSON)';
          }
        } catch (e) {
          // Just a regular string
          validationResults.classroomsIds = 'Invalid (plain string, not array)';
        }
      } else {
        validationResults.classroomsIds = `Invalid (unknown type: ${typeof formData.classroomsIds})`;
      }
    } else {
      validationResults.classroomsIds = 'Missing';
    }
    
    // Return all the data
    return NextResponse.json({
      requestInfo: {
        url,
        method,
        headers
      },
      formData: parsedFormData ? formData : 'Failed to parse form data',
      jsonData: parsedJson ? jsonData : 'Failed to parse JSON',
      rawBody: rawBody ? (rawBody.length > 1000 ? rawBody.substring(0, 1000) + '...' : rawBody) : 'Failed to read raw body',
      validation: validationResults,
      backendRequirements: {
        name: 'String, required',
        description: 'String, required',
        endDate: 'ISO date string, required',
        classroomsIds: 'Array of integers, required'
      },
      suggestedFix: 'Try sending classroomsIds as a JSON array with integers, e.g. [2]'
    });
  } catch (error) {
    console.error('Error in debug-activity endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 