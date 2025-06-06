#!/bin/bash

# Get an access token from Keycloak
echo "Getting access token from Keycloak..."
ACCESS_TOKEN=$(curl -s -X POST \
  "http://82.29.168.17:8080/realms/osRoom/protocol/openid-connect/token" \
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

# 1. Check if classrooms service is available
echo "Checking if classrooms service is available..."
CLASSROOMS_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:8000/api/v1/classrooms" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [ "$CLASSROOMS_CHECK" != "200" ]; then
  echo "Classrooms service is not available. Response code: $CLASSROOMS_CHECK"
  exit 1
fi

echo "Classrooms service is available!"

# 2. List available classrooms
echo "Listing available classrooms..."
CLASSROOMS=$(curl -s "http://localhost:8000/api/v1/classrooms" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

# Extract classroom IDs and names
echo "Available classrooms:"
echo "$CLASSROOMS" | grep -o '"id":[0-9]*,"name":"[^"]*"' | sed 's/"id":\([0-9]*\),"name":"\([^"]*\)"/ID: \1, Name: \2/'

# Get the first classroom ID for testing
CLASSROOM_ID=$(echo "$CLASSROOMS" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2 | tr -d ',')

if [ -z "$CLASSROOM_ID" ]; then
  echo "No classrooms found!"
  exit 1
fi

echo "Using classroom ID: $CLASSROOM_ID for testing"

# 3. Check if the classroom has students
echo "Checking if classroom has students..."
STUDENTS=$(curl -s "http://localhost:8000/api/v1/classrooms/$CLASSROOM_ID/students" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

# Count the number of students
STUDENT_COUNT=$(echo "$STUDENTS" | grep -o '"id"' | wc -l)
echo "Classroom has $STUDENT_COUNT students"

# 4. Test getting attendance for this classroom
echo "Testing attendance for classroom $CLASSROOM_ID..."
ATTENDANCE=$(curl -s "http://localhost:8226/api/v1/asistencias?classroomId=$CLASSROOM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

# Count attendance records
ATTENDANCE_COUNT=$(echo "$ATTENDANCE" | grep -o '"id"' | wc -l)
echo "Found $ATTENDANCE_COUNT attendance records"

# 5. If no attendance records, generate them
if [ "$ATTENDANCE_COUNT" -eq 0 ]; then
  echo "No attendance records found, generating new ones..."
  GENERATE_RESPONSE=$(curl -s -X POST \
    "http://localhost:8226/api/v1/asistencias/generate-for-classroom/$CLASSROOM_ID" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json")
  
  NEW_ATTENDANCE_COUNT=$(echo "$GENERATE_RESPONSE" | grep -o '"id"' | wc -l)
  echo "Generated $NEW_ATTENDANCE_COUNT new attendance records"
  
  # Check if student names are real (not "Estudiante de Prueba")
  DUMMY_COUNT=$(echo "$GENERATE_RESPONSE" | grep -o '"estudianteNombre":"Estudiante de Prueba' | wc -l)
  
  if [ "$DUMMY_COUNT" -gt 0 ]; then
    echo "WARNING: Found $DUMMY_COUNT dummy student names in the generated records!"
    echo "Student name samples:"
    echo "$GENERATE_RESPONSE" | grep -o '"estudianteNombre":"[^"]*"' | head -5
  else
    echo "Student names appear to be real (not dummy data)"
    echo "Student name samples:"
    echo "$GENERATE_RESPONSE" | grep -o '"estudianteNombre":"[^"]*"' | head -5
  fi
else
  # Check if student names are real (not "Estudiante de Prueba")
  DUMMY_COUNT=$(echo "$ATTENDANCE" | grep -o '"estudianteNombre":"Estudiante de Prueba' | wc -l)
  
  if [ "$DUMMY_COUNT" -gt 0 ]; then
    echo "WARNING: Found $DUMMY_COUNT dummy student names in existing records!"
    echo "Student name samples:"
    echo "$ATTENDANCE" | grep -o '"estudianteNombre":"[^"]*"' | head -5
  else
    echo "Student names appear to be real (not dummy data)"
    echo "Student name samples:"
    echo "$ATTENDANCE" | grep -o '"estudianteNombre":"[^"]*"' | head -5
  fi
fi

echo "Test completed!" 