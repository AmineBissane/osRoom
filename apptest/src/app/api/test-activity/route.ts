import { NextRequest, NextResponse } from 'next/server';

// This is a test endpoint to help debug the activity creation process
export async function POST(request: NextRequest) {
  try {
    // Check if request is form data
    const contentType = request.headers.get('content-type') || '';
    console.log('Content-Type:', contentType);
    
    if (contentType.includes('multipart/form-data')) {
      // Try to parse form data
      const formData = await request.formData();
      
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
      
      // Now create a modified version to send to the backend
      const newFormData = new FormData();
      
      // Add name field
      if (formData.has('name')) {
        newFormData.append('name', formData.get('name') as string);
      }
      
      // Add description field
      if (formData.has('description')) {
        newFormData.append('description', formData.get('description') as string);
      }
      
      // Add endDate field
      if (formData.has('endDate')) {
        newFormData.append('endDate', formData.get('endDate') as string);
      }
      
      // Parse and add classroomsIds field correctly
      if (formData.has('classroomsIds')) {
        try {
          const classroomsIdsString = formData.get('classroomsIds') as string;
          const classroomsIds = JSON.parse(classroomsIdsString);
          console.log('Parsed classroomsIds:', classroomsIds);
          newFormData.append('classroomsIds', JSON.stringify(classroomsIds));
        } catch (e) {
          console.error('Error parsing classroomsIds:', e);
        }
      }
      
      // Add file if present
      if (formData.has('file')) {
        const file = formData.get('file') as File;
        newFormData.append('file', file);
      }
      
      // Return the data we received and would send to backend
      return NextResponse.json({
        success: true,
        message: 'Form data received successfully',
        originalData: formDataObj,
        whatWeShouldSend: {
          name: formData.get('name'),
          description: formData.get('description'),
          endDate: formData.get('endDate'),
          classroomsIds: formData.has('classroomsIds') ? 
            JSON.parse(formData.get('classroomsIds') as string) : 
            undefined,
          file: formData.has('file') ? {
            name: (formData.get('file') as File).name,
            type: (formData.get('file') as File).type,
            size: (formData.get('file') as File).size
          } : undefined
        }
      });
    } else {
      // Try to parse JSON
      const data = await request.json();
      
      console.log('JSON data received:', data);
      
      return NextResponse.json({
        success: true,
        message: 'JSON data received successfully',
        data
      });
    }
  } catch (error) {
    console.error('Error in test-activity endpoint:', error);
    return NextResponse.json({
      success: false,
      message: 'Error processing request',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 