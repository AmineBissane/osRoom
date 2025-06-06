#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://82.29.168.17:8226"

echo -e "${YELLOW}Testing gestion-nap API...${NC}"

# Test 1: Ping endpoint
echo -e "\n${YELLOW}Test 1: Ping endpoint${NC}"
curl -s -X GET "${BASE_URL}/api/v1/test/ping" | jq

# Test 2: Auth endpoint without token
echo -e "\n${YELLOW}Test 2: Auth endpoint without token${NC}"
curl -s -X GET "${BASE_URL}/api/v1/test/auth" | jq

# Test 3: Keycloak test endpoint
echo -e "\n${YELLOW}Test 3: Keycloak test endpoint${NC}"
curl -s -X GET "${BASE_URL}/api/v1/test/keycloak" | jq

# Test 4: Get all users without token
echo -e "\n${YELLOW}Test 4: Get all users without token${NC}"
curl -s -X GET "${BASE_URL}/api/v1/users" | jq

# Test 5: Get all users with token (replace TOKEN with actual token)
echo -e "\n${YELLOW}Test 5: Get all users with token${NC}"
echo -e "${RED}Skipping - Replace TOKEN with actual token and uncomment${NC}"
# TOKEN="Bearer YOUR_TOKEN_HERE"
# curl -s -X GET "${BASE_URL}/api/v1/users" -H "Authorization: $TOKEN" | jq

# Test 6: Health endpoint
echo -e "\n${YELLOW}Test 6: Health endpoint${NC}"
curl -s -X GET "${BASE_URL}/actuator/health" | jq

echo -e "\n${GREEN}Tests completed${NC}" 