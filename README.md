# osRoom - Educational Microservices Platform

![Project Architecture](diagram.png)

## Overview

osRoom is a comprehensive educational platform built on a microservices architecture, designed to facilitate classroom management, student activities, and educational resource organization. The platform leverages modern cloud-native technologies to provide a scalable, maintainable, and resilient solution for educational institutions.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Services](#services)
- [Technologies](#technologies)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation and Setup](#installation-and-setup)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Monitoring and Observability](#monitoring-and-observability)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Classroom Management**: Create and manage virtual classrooms
- **Student Management**: Manage student profiles, enrollments, and activities
- **School Administration**: Handle school-related operations and data
- **Activity Management**: Create, assign, and evaluate educational activities
- **Real-time Communication**: Integrated with LiveKit for real-time video conferencing
- **File Storage**: Secure file storage and management for educational resources
- **Authentication & Authorization**: Secure access control with Keycloak
- **Centralized Configuration**: Dynamic configuration management
- **Service Discovery**: Automatic service registration and discovery
- **API Gateway**: Single entry point for all client requests

## Architecture

osRoom follows a microservices architecture pattern with the following key components:

- **API Gateway**: Serves as the single entry point for all client requests
- **Config Server**: Centralizes configuration management
- **Discovery Server**: Provides service registration and discovery
- **Microservices**: Specialized services for specific business domains

## Services

| Service | Description | Port |
|---------|-------------|------|
| `gateway` | API Gateway service for routing requests | 8222 |
| `config-server` | Centralized configuration management | 8888 |
| `discovery` | Service discovery and registration | 8761 |
| `gestion-nap` | Core management service | 8226 |
| `student` | Student profile and management | 8090 |
| `school` | School management and operations | 8070 |
| `classrooms` | Classroom management | 8000 |
| `activities` | Educational activities management | 8010 |
| `activitiesresponses` | Student responses to activities | 8020 |
| `file-storage` | Document and media file storage | 8030 |

## Technologies

- **Backend**: Spring Boot, Spring Cloud
- **Database**: PostgreSQL
- **Security**: Keycloak for Identity and Access Management
- **Service Communication**: Spring Cloud OpenFeign
- **Monitoring**: Spring Boot Actuator
- **Tracing**: Zipkin for distributed tracing
- **Containerization**: Docker and Docker Compose
- **Real-time Communication**: LiveKit

## Getting Started

### Prerequisites

Ensure you have the following installed:

- Java Development Kit (JDK) 17 or later
- Maven 3.8+
- Docker and Docker Compose
- Git

### Installation and Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/osRoom.git
   cd osRoom
   ```

2. Start the services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Access the services:
   - Discovery Server: http://localhost:8761
   - API Gateway: http://localhost:8222
   - Keycloak Admin Console: http://localhost:8080
   - PostgreSQL Admin: http://localhost:5050
   - Zipkin: http://localhost:9411

## API Documentation

API documentation is available through Swagger UI for each service at the `/swagger-ui.html` endpoint.

## Security

The platform uses Keycloak for authentication and authorization. Default credentials:

- Admin User: admin
- Admin Password: admin

**Note**: Change default credentials in production environments.

## Monitoring and Observability

- **Health Checks**: Each service exposes health endpoints via Spring Boot Actuator
- **Distributed Tracing**: Zipkin provides visualization of service interactions
- **Database Administration**: PgAdmin for PostgreSQL database management

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
