# osRoom - Plataforma Educativa basada en Microservicios

## Descripción General

osRoom es una plataforma educativa integral construida sobre una arquitectura de microservicios, diseñada para facilitar la gestión de aulas virtuales, actividades estudiantiles y la organización de recursos educativos. La plataforma aprovecha tecnologías modernas nativas de la nube para proporcionar una solución escalable, mantenible y resiliente para instituciones educativas. Implementa patrones de diseño avanzados y principios SOLID para garantizar la extensibilidad y la separación de responsabilidades en cada componente del sistema.

## Índice de Contenidos

- [Características Principales](#características-principales)
- [Arquitectura Técnica](#arquitectura-técnica)
- [Servicios Implementados](#servicios-implementados)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Guía de Inicio](#guía-de-inicio)
  - [Requisitos Previos](#requisitos-previos)
  - [Instalación y Configuración](#instalación-y-configuración)
  - [Variables de Entorno](#variables-de-entorno)
- [Documentación de API](#documentación-de-api)
- [Seguridad e Identidad](#seguridad-e-identidad)
- [Monitorización y Observabilidad](#monitorización-y-observabilidad)
- [Estrategia de Pruebas](#estrategia-de-pruebas)
- [Gestión de Datos](#gestión-de-datos)
- [Escalabilidad](#escalabilidad)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Resolución de Problemas](#resolución-de-problemas)
- [Contribuciones](#contribuciones)
- [Licencia](#licencia)

## Características Principales

- **Gestión de Aulas Virtuales**: Sistema avanzado para la creación y administración de aulas virtuales con capacidades de programación, asignación de estudiantes y gestión de recursos educativos.
- **Administración de Estudiantes**: Sistema integral para la gestión de perfiles de estudiantes, inscripciones y seguimiento de actividades académicas con implementación de políticas de privacidad de datos.
- **Administración Escolar**: Módulo completo para operaciones administrativas escolares, incluyendo gestión de personal, recursos e infraestructura virtual.
- **Gestión de Actividades**: Motor de creación, asignación y evaluación de actividades educativas con capacidad para diferentes tipos de contenido interactivo y sistemas de calificación configurables.
- **Comunicación en Tiempo Real**: Integración avanzada con LiveKit para videoconferencias y colaboración en tiempo real, implementando WebRTC con optimizaciones de latencia y calidad.
- **Almacenamiento de Archivos**: Sistema distribuido y seguro para almacenamiento y gestión de recursos educativos, con políticas de retención y control de versiones.
- **Autenticación y Autorización**: Control de acceso seguro mediante Keycloak, implementando OAuth2, OpenID Connect y gestión granular de roles y permisos.
- **Configuración Centralizada**: Gestión dinámica de configuraciones mediante servidor de configuración Spring Cloud Config con soporte para perfiles por entorno.
- **Descubrimiento de Servicios**: Registro y descubrimiento automático de servicios utilizando Netflix Eureka con balanceo de carga dinámico.
- **API Gateway**: Punto de entrada único para todas las solicitudes de clientes implementando patrones de control de tráfico, circuit breaker y rate limiting.

## Arquitectura Técnica

osRoom implementa una arquitectura de microservicios con los siguientes componentes y patrones de diseño:

### Patrones Arquitectónicos Implementados

- **API Gateway**: Implementación del patrón API Gateway utilizando Spring Cloud Gateway con enrutamiento dinámico, filtros pre/post y capacidades de transformación de mensajes.
- **Servidor de Configuración**: Centralización de configuraciones mediante Spring Cloud Config Server conectado a repositorio Git para control de versiones de configuración.
- **Servidor de Descubrimiento**: Implementación del patrón Service Registry con Netflix Eureka para descubrimiento de servicios y resolución dinámica de endpoints.
- **Microservicios Especializados**: Descomposición del dominio siguiendo principios de Domain-Driven Design (DDD) y Context Mapping para definir límites entre servicios.
- **Comunicación Asíncrona**: Implementación de Event-Driven Architecture para comunicación entre servicios mediante mensajería asíncrona.
- **CQRS**: Separación de operaciones de lectura y escritura en servicios críticos para optimización de rendimiento.
- **Circuit Breaker**: Implementación de patrones de resiliencia con Resilience4j para manejar fallos de servicios y degradación controlada.
- **Saga Pattern**: Implementación de transacciones distribuidas para operaciones complejas que involucran múltiples servicios.

### Capas de Implementación por Servicio

Cada microservicio implementa una arquitectura en capas:

1. **Capa de API**: Controladores REST y definición de contratos de API
2. **Capa de Aplicación**: Orquestación de casos de uso e implementación de lógica de negocio
3. **Capa de Dominio**: Modelos de dominio, reglas de negocio y lógica central
4. **Capa de Infraestructura**: Implementaciones técnicas, persistencia y comunicación externa
5. **Capa de Configuración**: Configuración técnica del servicio

## Servicios Implementados

| Servicio | Descripción | Puerto | Dominio Funcional | Patrones Implementados |
|---------|-------------|------|-------------------|------------------------|
| `gateway` | Servicio Gateway API para enrutamiento de solicitudes | 8222 | Infraestructura | API Gateway, Load Balancing, Circuit Breaker |
| `config-server` | Gestión centralizada de configuraciones | 8888 | Infraestructura | Externalización de Configuración |
| `discovery` | Registro y descubrimiento de servicios | 8761 | Infraestructura | Service Registry, Service Discovery |
| `gestion-nap` | Servicio central de gestión | 8226 | Core | CQRS, Event Sourcing |
| `student` | Gestión de perfiles y administración de estudiantes | 8090 | Estudiantes | Repository, Specification |
| `school` | Gestión escolar y operaciones | 8070 | Instituciones | Aggregate Root, Domain Services |
| `classrooms` | Gestión de aulas virtuales | 8000 | Aulas | Factory, Builder |
| `activities` | Gestión de actividades educativas | 8010 | Actividades | Strategy, Template Method |
| `activitiesresponses` | Respuestas de estudiantes a actividades | 8020 | Actividades | Observer, Command |
| `file-storage` | Almacenamiento de documentos y archivos multimedia | 8030 | Infraestructura | Proxy, Decorator |

## Tecnologías Utilizadas

### Backend
- **Framework Principal**: Spring Boot 3.x, Spring Cloud 2023.x
- **Persistencia**: Spring Data JPA, Hibernate ORM 6.x
- **Comunicación entre Servicios**: Spring Cloud OpenFeign, Spring WebFlux
- **Mensajería**: Spring Cloud Stream, Apache Kafka
- **Cache**: Redis, Caffeine

### Base de Datos
- **Principal**: PostgreSQL 15.x con configuración de alta disponibilidad
- **Cache**: Redis Cluster
- **Monitoreo de DB**: PgAdmin, PgHero

### Seguridad
- **IAM**: Keycloak 24.x para gestión de identidades y acceso
- **Implementación**: OAuth2 Resource Server, OpenID Connect
- **Autorización**: Attribute-Based Access Control (ABAC)
- **Cifrado**: AES-256, RSA-2048, HTTPS/TLS 1.3

### Monitorización
- **Métricas**: Spring Boot Actuator, Micrometer, Prometheus
- **Logs**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Trazabilidad**: Zipkin, Spring Cloud Sleuth
- **Alertas**: Grafana Alertmanager

### Contenedores y Orquestación
- **Contenedorización**: Docker con imágenes optimizadas multi-etapa
- **Composición**: Docker Compose para entornos de desarrollo
- **Orquestación**: Kubernetes (opcional) para entornos de producción

### Comunicación en Tiempo Real
- **Videoconferencia**: LiveKit basado en WebRTC
- **Mensajería**: WebSockets, STOMP

## Guía de Inicio

### Requisitos Previos

Asegúrese de tener instalado lo siguiente:

- Java Development Kit (JDK) 17 o posterior
- Maven 3.8+
- Docker y Docker Compose
- Git
- NodeJS 18+ (para herramientas de desarrollo)
- PostgreSQL Client (opcional, para acceso directo a la base de datos)

### Instalación y Configuración

1. Clone el repositorio:
   ```bash
   git clone https://github.com/yourusername/osRoom.git
   cd osRoom
   ```

2. Configure las variables de entorno necesarias (ver sección de Variables de Entorno)

3. Inicie los servicios utilizando Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Verifique el estado de los servicios:
   ```bash
   docker-compose ps
   ```

5. Acceda a los servicios:
   - Servidor de Descubrimiento: http://localhost:8761
   - API Gateway: http://localhost:8222
   - Consola de Administración de Keycloak: http://localhost:8080
   - Administrador de PostgreSQL: http://localhost:5050
   - Zipkin: http://localhost:9411

### Variables de Entorno

El proyecto utiliza diversas variables de entorno para configuración. A continuación se detallan las más importantes:

| Variable | Descripción | Valor Predeterminado | Obligatoria |
|----------|-------------|----------------------|-------------|
| `SPRING_PROFILES_ACTIVE` | Perfil activo de Spring | `docker` | Sí |
| `SPRING_DATASOURCE_URL` | URL de conexión a la base de datos | `jdbc:postgresql://postgresql:5432/gestion_nap` | Sí |
| `SPRING_DATASOURCE_USERNAME` | Usuario de la base de datos | `alibou` | Sí |
| `SPRING_DATASOURCE_PASSWORD` | Contraseña de la base de datos | `alibou` | Sí |
| `EUREKA_CLIENT_SERVICE-URL_DEFAULTZONE` | URL de Eureka Server | `http://discovery:8761/eureka/` | Sí |
| `SPRING_CONFIG_IMPORT` | URL del servidor de configuración | `optional:configserver:http://config-server:8888` | Sí |
| `KEYCLOAK_URL` | URL de Keycloak | `http://keycloak:8080` | Sí |
| `KEYCLOAK_REALM` | Realm de Keycloak | `osRoom` | Sí |
| `LOGGING_LEVEL_*` | Nivel de logging para diferentes paquetes | Varía | No |

## Documentación de API

La documentación de API está disponible a través de OpenAPI (Swagger) para cada servicio en el endpoint `/swagger-ui.html`. La documentación incluye:

- Descripción detallada de endpoints
- Modelos de datos con ejemplos
- Códigos de respuesta y manejo de errores
- Mecanismos de autenticación
- Pruebas interactivas de API

### Convenciones de API

Los endpoints siguen las siguientes convenciones:

- API RESTful con uso adecuado de métodos HTTP
- Versionado mediante URL path (/api/v1/...)
- Respuestas consistentes con envelope pattern
- Paginación estándar con parámetros page, size, sort
- Filtrado mediante query parameters
- Manejo unificado de errores con códigos y mensajes estandarizados

## Seguridad e Identidad

El sistema utiliza Keycloak para autenticación y autorización con las siguientes características:

### Configuración de Keycloak

- **Realm**: osRoom
- **Clientes**: Configurados por microservicio con scope y roles específicos
- **Roles**: Jerarquía de roles con herencia de permisos
- **Flujos de Autenticación**: Password, Social Login, MFA
- **Federación de Identidad**: LDAP/Active Directory (opcional)

### Modelo de Permisos

El sistema implementa un modelo de permisos basado en roles (RBAC) con granularidad fina:

| Rol | Descripción | Permisos Generales |
|-----|-------------|-------------------|
| `ADMIN` | Administrador del sistema | Acceso completo |
| `SCHOOL_ADMIN` | Administrador de escuela | Gestión escolar |
| `TEACHER` | Profesor | Gestión de aulas y actividades |
| `STUDENT` | Estudiante | Acceso a aulas y actividades asignadas |
| `PARENT` | Padre/Tutor | Visualización de progreso de estudiantes |

### Credenciales Predeterminadas

- Usuario Administrador: admin
- Contraseña Administrador: admin

**Nota**: Cambie las credenciales predeterminadas en entornos de producción.

## Monitorización y Observabilidad

El sistema implementa un enfoque integral para monitorización y observabilidad:

### Endpoints de Salud

Cada servicio expone endpoints de salud a través de Spring Boot Actuator:
- `/actuator/health`: Estado general del servicio
- `/actuator/info`: Información del servicio
- `/actuator/metrics`: Métricas detalladas
- `/actuator/prometheus`: Métricas en formato Prometheus

### Trazabilidad Distribuida

Zipkin proporciona visualización de interacciones entre servicios:
- Registro de latencia entre servicios
- Trazas completas de transacciones
- Identificación de cuellos de botella
- Correlación de logs entre servicios

### Administración de Base de Datos

PgAdmin para gestión de bases de datos PostgreSQL:
- Administración de esquemas y tablas
- Monitoreo de rendimiento
- Ejecución de consultas
- Gestión de índices y optimización

## Estrategia de Pruebas

El proyecto implementa una estrategia de pruebas en múltiples niveles:

### Pruebas Unitarias

- Framework: JUnit 5, Mockito
- Cobertura objetivo: >80%
- Enfoque: Lógica de negocio y validaciones

### Pruebas de Integración

- Framework: Spring Boot Test, Testcontainers
- Enfoque: Interacción con bases de datos y servicios externos
- Automatización: Pipeline CI/CD

### Pruebas de Contrato

- Framework: Spring Cloud Contract
- Enfoque: Contratos entre microservicios
- CDC (Consumer-Driven Contracts)

### Pruebas End-to-End

- Framework: Selenium, RestAssured
- Enfoque: Flujos completos de usuario
- Automatización: Ejecución periódica

## Gestión de Datos

### Esquema de Base de Datos

El sistema utiliza múltiples bases de datos PostgreSQL con los siguientes esquemas principales:

- **gestion_nap**: Esquema principal de gestión
- **keycloak**: Datos de identidad y acceso
- Esquemas específicos por microservicio siguiendo el patrón Database-per-Service

### Migración de Datos

- Framework: Flyway para migraciones controladas
- Estrategia: Versiones incrementales con scripts idempotentes
- Rollback: Scripts de rollback para cada migración

### Respaldo y Recuperación

- Estrategia: Respaldos incrementales diarios, completos semanales
- Retención: 30 días para respaldos diarios, 12 meses para semanales
- Pruebas: Verificación mensual de procedimientos de recuperación

## Escalabilidad

### Estrategias de Escalado

El sistema está diseñado para escalabilidad horizontal:

- Servicios stateless para facilitar replicación
- Balanceo de carga a nivel de servicio
- Caché distribuida con Redis
- Particionamiento de bases de datos para alta carga

### Consideraciones de Rendimiento

- Optimización de consultas con índices apropiados
- Implementación de patrones CQRS para servicios de alta demanda
- Uso de caché en múltiples niveles
- Paginación y optimización de carga diferida

## Proceso de Desarrollo

### Flujo de Trabajo Git

El proyecto sigue un flujo de trabajo GitFlow:

1. `main`: Código de producción estable
2. `develop`: Integración para próxima versión
3. `feature/*`: Nuevas funcionalidades
4. `release/*`: Preparación para lanzamiento
5. `hotfix/*`: Correcciones urgentes en producción

### Estándares de Código

- Convenciones Java: Google Java Style Guide
- API REST: Best Practices de REST
- Revisión de código: Obligatoria para todas las contribuciones
- Análisis estático: SonarQube, SpotBugs

## Resolución de Problemas

### Problemas Comunes y Soluciones

1. **Servicios no se registran en Eureka**
   - Verificar conectividad de red entre contenedores
   - Comprobar configuración de hostname y preferDnsServiceDiscovery

2. **Errores de autenticación con Keycloak**
   - Verificar configuración de clientes y secretos
   - Comprobar mapeo de roles y permisos

3. **Problemas de conectividad a base de datos**
   - Verificar credenciales y URL de conexión
   - Comprobar estado y health check de PostgreSQL

### Logs y Diagnóstico

- Ubicación de logs: `/var/logs/` en cada contenedor
- Nivel de detalle: Configurable mediante variables de entorno
- Formato: JSON estructurado para procesamiento automatizado
- Agregación: ELK Stack (opcional para despliegues avanzados)

## Contribuciones

Las contribuciones son bienvenidas. Por favor, lea nuestras directrices de contribución antes de enviar pull requests.

1. Bifurque (fork) el repositorio
2. Cree su rama de funcionalidad (`git checkout -b feature/funcionalidad-increible`)
3. Commit de sus cambios (`git commit -m 'Añadir funcionalidad increíble'`)
4. Push a la rama (`git push origin feature/funcionalidad-increible`)
5. Abra un Pull Request

### Proceso de Revisión

- Revisión obligatoria por al menos un mantenedor
- Conformidad con estándares de código y pruebas
- Documentación adecuada de cambios
- Pruebas automatizadas que pasen

## Licencia

Este proyecto está licenciado bajo una Licencia de Uso No Comercial - consulte el archivo [LICENSE](LICENSE) para más detalles. El software puede ser utilizado libremente solo para fines no comerciales. Cualquier uso comercial requiere permiso explícito por escrito del titular de los derechos de autor.
