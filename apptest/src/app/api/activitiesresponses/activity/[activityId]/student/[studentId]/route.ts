import { NextRequest, NextResponse } from 'next/server';

/**
 * Handler para obtener las respuestas de un estudiante específico para una actividad específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { activityId: string, studentId: string } }
) {
  console.log(`Fetching responses for activity: ${params.activityId} and student: ${params.studentId}`);
  
  // Obtener el token de autenticación
  const token = request.cookies.get('access_token')?.value;
  const authHeader = request.headers.get('authorization');
  const tokenFromHeader = authHeader ? authHeader.replace('Bearer ', '') : null;
  
  // Usar token de cookie o header
  const accessToken = token || tokenFromHeader;
  
  if (!accessToken) {
    return NextResponse.json(
      { error: 'No authentication token found' },
      { status: 401 }
    );
  }
  
  try {
    // Intentar obtener las respuestas del estudiante desde el backend
    const backendUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${params.activityId}/student/${params.studentId}`;
    console.log(`Making request to backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      // Try to get more details from the error response
      try {
        const errorData = await response.text();
        console.error('Error details:', errorData);
      } catch (e) {
        console.error('Could not read error details');
      }
      
      return NextResponse.json(
        { error: `Failed to fetch student responses: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching student responses:', error);
    // Devolver array vacío para mejorar la experiencia de usuario
    return NextResponse.json([]);
  }
} 