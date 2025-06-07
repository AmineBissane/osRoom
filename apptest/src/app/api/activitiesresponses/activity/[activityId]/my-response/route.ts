import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId, decodeJwt } from '@/utils/fetchWithAuth';

/**
 * Handler para obtener las respuestas del usuario actual para una actividad específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { activityId: string } }
) {
  console.log(`Fetching current user's responses for activity: ${params.activityId}`);
  
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
    // Obtener el ID del usuario del token
    const userId = getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Could not determine user ID from token' },
        { status: 400 }
      );
    }
    
    console.log(`Using user ID from token: ${userId}`);
    
    // Decodificar el token para verificar el tipo de ID
    const decodedToken = accessToken ? decodeJwt(accessToken) : null;
    
    // Intentar primero el endpoint de búsqueda por UUID
    try {
      // Usar endpoint con path "user" para buscar por UUID en lugar de "student"
      const userEndpointUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${params.activityId}/user/${userId}`;
      console.log(`Trying UUID-based endpoint: ${userEndpointUrl}`);
      
      const userResponse = await fetch(userEndpointUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      // Si el endpoint UUID funciona, usarlo
      if (userResponse.ok) {
        const data = await userResponse.json();
        console.log(`UUID endpoint success, returned ${Array.isArray(data) ? data.length : 'unknown'} responses`);
        return NextResponse.json(data);
      } else {
        console.log(`UUID endpoint failed with status: ${userResponse.status}, trying alternatives...`);
      }
    } catch (uuidError) {
      console.warn('Error with UUID endpoint:', uuidError);
    }
    
    // Si el endpoint de UUID falló, intentar con my-responses que no requiere ID
    try {
      const myResponsesUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/my-responses?activityId=${params.activityId}`;
      console.log(`Trying my-responses endpoint: ${myResponsesUrl}`);
      
      const myResponsesResponse = await fetch(myResponsesUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (myResponsesResponse.ok) {
        const data = await myResponsesResponse.json();
        console.log(`my-responses endpoint success, returned ${Array.isArray(data) ? data.length : 'unknown'} responses`);
        return NextResponse.json(data);
      } else {
        console.log(`my-responses endpoint failed with status: ${myResponsesResponse.status}, trying fallback...`);
      }
    } catch (myResponsesError) {
      console.warn('Error with my-responses endpoint:', myResponsesError);
    }
    
    // Como último recurso, intentar convertir el UUID a un ID numérico
    const lastResortUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${params.activityId}/student/${userId}`;
    console.log(`Trying fallback student endpoint: ${lastResortUrl}`);
    
    const response = await fetch(lastResortUrl, {
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
        { error: `Failed to fetch activity responses: ${response.status}` },
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