Test Generator Full
==========================================
Structure:
  /backend  - Spring Boot (Gradle Groovy), Java 17
  /frontend - React (Vite), Node 18+

Quick start:
1) Backend
   - cd backend
   - (optional) generate gradle wrapper: gradle wrapper
   - ./gradlew bootRun
   - Backend runs on http://localhost:8081

2) Frontend
   - cd frontend
   - npm install react-beautiful-dnd
   - npm install
   - npm run dev
   - Open http://localhost:3000

Notes:
  - The frontend is configured to proxy /api to http://localhost:8081
  - H2 console: http://localhost:8081/h2-console
    JDBC URL: jdbc:h2:mem:demo
