import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint alternativo para obtener todas las respuestas de una actividad específica
 * Este endpoint proporciona una ruta adicional para acceder a las respuestas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  console.log(`[Alternative endpoint] Fetching responses for activity: ${params.activityId}`);
  
  // Obtener el token de autenticación directamente del request
  const token = request.cookies.get('access_token')?.value;
  
  if (!token) {
    return NextResponse.json(
      { error: 'No authentication token found' },
      { status: 401 }
    );
  }
  
  try {
    // Intentar obtener todas las respuestas para esta actividad desde el backend
    const backendUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${params.activityId}`;
    console.log(`Making request to backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
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
        { error: `Failed to fetch activity responses: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error fetching activity responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity responses' },
      { status: 500 }
    );
  }
} 