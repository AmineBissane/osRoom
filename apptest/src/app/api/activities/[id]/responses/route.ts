import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint alternativo para obtener todas las respuestas de una actividad específica
 * Este endpoint proporciona una ruta adicional para acceder a las respuestas
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`[Alternative endpoint] Fetching responses for activity: ${params.id}`);
  
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
    const backendUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${params.id}`;
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
      // Si el primer endpoint falla, intentar con un endpoint alternativo
      const alternativeUrl = `http://82.29.168.17:8222/api/v1/activities/${params.id}/responses`;
      console.log(`Trying alternative backend endpoint: ${alternativeUrl}`);
      
      const alternativeResponse = await fetch(alternativeUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!alternativeResponse.ok) {
        return NextResponse.json(
          { error: `Failed to fetch responses from both endpoints` },
          { status: alternativeResponse.status }
        );
      }
      
      const alternativeData = await alternativeResponse.json();
      return NextResponse.json(alternativeData);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses from backend' },
      { status: 500 }
    );
  }
} 