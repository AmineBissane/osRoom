#!/bin/bash

# Get an access token from Keycloak
echo "Getting access token from Keycloak..."
ACCESS_TOKEN=$(curl -s -X POST \
  "http://localhost:8080/realms/osRoom/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Failed to get access token, using empty token"
  ACCESS_TOKEN=""
else
  echo "Got access token"
fi

# First, make sure the classrooms service is working
echo "Checking classrooms service..."
CLASSROOMS_RESPONSE=$(curl -s "http://localhost:8000/api/v1/classrooms" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

CLASSROOM_COUNT=$(echo "$CLASSROOMS_RESPONSE" | grep -o '"id"' | wc -l)
echo "Found $CLASSROOM_COUNT classrooms"

if [ "$CLASSROOM_COUNT" -eq 0 ]; then
  echo "No classrooms found! Services might not be running correctly."
  exit 1
fi

# Get the first classroom ID
CLASSROOM_ID=$(echo "$CLASSROOMS_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2 | tr -d ',')
echo "Using classroom ID: $CLASSROOM_ID"

# Check if students endpoint returns realistic names
echo "Checking students from classrooms service..."
STUDENTS_RESPONSE=$(curl -s "http://localhost:8000/api/v1/classrooms/$CLASSROOM_ID/students" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

STUDENT_COUNT=$(echo "$STUDENTS_RESPONSE" | grep -o '"id"' | wc -l)
echo "Found $STUDENT_COUNT students in classroom $CLASSROOM_ID"

# Check student names quality
echo "Student name samples from classrooms service:"
echo "$STUDENTS_RESPONSE" | grep -o '"firstName":"[^"]*","lastName":"[^"]*"' | head -5

# Check for generic "Student" first names
GENERIC_STUDENT_COUNT=$(echo "$STUDENTS_RESPONSE" | grep -o '"firstName":"Student"' | wc -l)
if [ "$GENERIC_STUDENT_COUNT" -gt 0 ]; then
  echo "WARNING: Found $GENERIC_STUDENT_COUNT generic 'Student' first names in classroom service!"
else
  echo "✓ No generic 'Student' first names found in classroom service"
fi

# Now check attendance service
echo -e "\nChecking attendance service..."
echo "First, clear any existing attendance records for this classroom..."
# This is just for testing - in production you wouldn't want to delete records

# Generate new attendance records
echo "Generating new attendance records for classroom $CLASSROOM_ID..."
ATTENDANCE_RESPONSE=$(curl -s -X POST \
  "http://localhost:8226/api/v1/asistencias/generate-for-classroom/$CLASSROOM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

ATTENDANCE_COUNT=$(echo "$ATTENDANCE_RESPONSE" | grep -o '"id"' | wc -l)
echo "Generated $ATTENDANCE_COUNT attendance records"

if [ "$ATTENDANCE_COUNT" -eq 0 ]; then
  echo "Failed to generate attendance records!"
  exit 1
fi

# Check for generic "Estudiante de Prueba" names
GENERIC_NAME_COUNT=$(echo "$ATTENDANCE_RESPONSE" | grep -o '"estudianteNombre":"Estudiante de Prueba' | wc -l)
if [ "$GENERIC_NAME_COUNT" -gt 0 ]; then
  echo "ERROR: Found $GENERIC_NAME_COUNT generic 'Estudiante de Prueba' names in attendance records!"
  echo "Our fix is not working correctly."
else
  echo "✓ No 'Estudiante de Prueba' names found in generated attendance records!"
fi

# Check for generic "Estudiante" names
GENERIC_NAME_COUNT=$(echo "$ATTENDANCE_RESPONSE" | grep -o '"estudianteNombre":"Estudiante ' | wc -l)
if [ "$GENERIC_NAME_COUNT" -gt 0 ]; then
  echo "WARNING: Found $GENERIC_NAME_COUNT generic 'Estudiante' names in attendance records!"
else
  echo "✓ No generic 'Estudiante' names found in attendance records"
fi

# Show a sample of the student names
echo -e "\nSample student names from attendance records:"
echo "$ATTENDANCE_RESPONSE" | grep -o '"estudianteNombre":"[^"]*"' | head -5 | sed 's/"estudianteNombre":"//;s/"//g'

echo -e "\nVerification completed!" 