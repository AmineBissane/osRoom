import Cookies from 'js-cookie';
import { parseJwt } from './parseJwt';

export const fetchClassroomsByCategory = async () => {
  try {
    // Get the token from cookies
    const token = Cookies.get('access_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Get the user's class category from the JWT token
    const tokenData = parseJwt(token);
    const classCategory = tokenData?.class || 'DAM'; // Default to 'DAM' if not found
    
    console.log('Fetching classrooms for category:', classCategory);
    
    // Use the proxy API endpoint instead of calling the gateway directly
    const response = await fetch(`/api/proxy/classrooms/category/${classCategory}`, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch classrooms: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    throw error;
  }
}; 