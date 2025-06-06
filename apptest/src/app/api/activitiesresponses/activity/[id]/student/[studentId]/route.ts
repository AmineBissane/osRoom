import { NextRequest, NextResponse } from 'next/server';

/**
 * Handler para obtener las respuestas de un estudiante específico para una actividad específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string, studentId: string } }
) {
  console.log(`Fetching responses for activity: ${params.id} and student: ${params.studentId}`);
  
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
    // Verificar si el studentId parece un UUID (contiene guiones)
    const isUuid = params.studentId.includes('-');
    
    // Intentar primero con el endpoint apropiado según el tipo de ID
    let firstAttemptUrl = '';
    
    if (isUuid) {
      // Intentar con un endpoint que soporte UUIDs
      firstAttemptUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${params.id}/user/${params.studentId}`;
    } else {
      // Usar el endpoint original para IDs numéricos
      firstAttemptUrl = `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${params.id}/student/${params.studentId}`;
    }
    
    console.log(`First attempt URL: ${firstAttemptUrl}`);
    
    // Primer intento
    try {
      const firstResponse = await fetch(firstAttemptUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (firstResponse.ok) {
        const data = await firstResponse.json();
        console.log(`First attempt successful, returned ${Array.isArray(data) ? data.length : 'unknown'} responses`);
        return NextResponse.json(data);
      } else {
        console.log(`First attempt failed with status: ${firstResponse.status}, trying fallback...`);
      }
    } catch (firstError) {
      console.warn('Error with first attempt:', firstError);
    }
    
    // Segundo intento con el endpoint alternativo
    const secondAttemptUrl = isUuid 
      ? `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${params.id}/student/${params.studentId}`
      : `http://82.29.168.17:8222/api/v1/activitiesresponses/activity/${params.id}/user/${params.studentId}`;
    
    console.log(`Second attempt URL: ${secondAttemptUrl}`);
    
    const response = await fetch(secondAttemptUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.warn(`Both attempts failed. Last status: ${response.status}`);
      
      // Si todo falla pero es un error de tipo/formato, devolver array vacío en vez de error
      if (response.status === 500 || response.status === 400) {
        // Comprobar si el error es por incompatibilidad de tipos
        try {
          const errorText = await response.text();
          console.error('Error details:', errorText);
          
          if (errorText.includes('MethodArgumentTypeMismatchException') || 
              errorText.includes('Failed to convert') ||
              errorText.includes('type') ||
              errorText.includes('format')) {
            console.log('Type mismatch detected, returning empty array');
            return NextResponse.json([]);
          }
          
          return NextResponse.json(
            { error: `Failed to fetch student responses: ${response.status}`, details: errorText },
            { status: response.status }
          );
        } catch (e) {
          // Si no podemos leer el error, asumir que es un problema de tipos
          console.log('Could not read error details, returning empty array');
          return NextResponse.json([]);
        }
      }
      
      return NextResponse.json(
        { error: `Failed to fetch student responses: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log(`Second attempt successful, returned ${Array.isArray(data) ? data.length : 'unknown'} responses`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching student responses:', error);
    // Devolver array vacío para mejorar la experiencia de usuario
    return NextResponse.json([]);
  }
} 