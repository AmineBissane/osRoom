FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install necessary tools for healthcheck
RUN apk add --no-cache curl

# Copy the JAR from the build stage
COPY --from=build /app/target/gestion-nap-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8226
ENV SPRING_CONFIG_IMPORT=optional:configserver:http://config-server:8888
ENV EUREKA_CLIENT_SERVICE-URL_DEFAULTZONE=http://discovery:8761/eureka/
ENV CLASSROOMS_URL=http://classrooms:8000

ENTRYPOINT ["java", "-jar", "app.jar"] 