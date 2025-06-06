#!/bin/bash

# Get an access token from Keycloak (adapt this to your environment)
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

# Classroom ID to test - you can pass this as a parameter
CLASSROOM_ID=${1:-1}

# First, check that the classroom exists
echo "Checking if classroom $CLASSROOM_ID exists..."
CLASSROOM_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
  "http://82.29.168.17:8000/api/v1/classrooms/classroom/$CLASSROOM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if [ "$CLASSROOM_CHECK" != "200" ]; then
  echo "Classroom $CLASSROOM_ID does not exist. Response code: $CLASSROOM_CHECK"
  echo "Available classrooms:"
  curl -s "http://82.29.168.17:8000/api/v1/classrooms" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | grep -o '"id":[0-9]*,"name":"[^"]*"' | sed 's/"id":\([0-9]*\),"name":"\([^"]*\)"/ID: \1, Name: \2/'
  exit 1
fi

# Generate attendance for the specified classroom
echo "Generating attendance records for classroom $CLASSROOM_ID..."
RESPONSE=$(curl -s -X POST \
  "http://82.29.168.17:8226/api/v1/asistencias/generate-for-classroom/$CLASSROOM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

# Check if the response indicates success
if [[ $RESPONSE == *"present"* ]]; then
  echo "Successfully generated attendance records!"
  echo "Number of records generated: $(echo $RESPONSE | grep -o '"id"' | wc -l)"
else
  echo "Failed to generate attendance records."
  echo "Response: $RESPONSE"
fi

# Now test getting the attendance records
echo "Retrieving attendance records for classroom $CLASSROOM_ID..."
RECORDS=$(curl -s \
  "http://82.29.168.17:8226/api/v1/asistencias?classroomId=$CLASSROOM_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

# Check if we got attendance records
if [[ $RECORDS == *"present"* ]]; then
  echo "Successfully retrieved attendance records!"
  echo "Number of records: $(echo $RECORDS | grep -o '"id"' | wc -l)"
else
  echo "Failed to retrieve attendance records or none exist."
  echo "Response: $RECORDS"
fi

echo "Done!" 