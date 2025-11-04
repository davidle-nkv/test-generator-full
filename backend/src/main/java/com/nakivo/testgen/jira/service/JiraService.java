package com.nakivo.testgen.jira.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nakivo.testgen.config.JiraConfig;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Base64;
import java.util.Map;

@Service
public class JiraService {

    private final JiraConfig jiraConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public JiraService(JiraConfig jiraConfig) {
        this.jiraConfig = jiraConfig;
    }

    /**
     * Updates Jira issue description
     */
    public void updateDescription(String issueKey, String newDescription) {
        String url = jiraConfig.getBaseUrl() + "/rest/api/2/issue/" + issueKey;

        Map<String, Object> body = Map.of(
            "fields", Map.of("description", newDescription)
        );

        String jsonBody = null;
        try {
            jsonBody = objectMapper.writeValueAsString(body);
        } catch (JsonProcessingException e) {
            throw new RuntimeException(e);
        }

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(url))
            .header("Authorization", buildAuthHeader())
            .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
            .PUT(HttpRequest.BodyPublishers.ofString(jsonBody))
            .build();

        HttpResponse<String> response = null;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException("Failed to update Jira description: " + response.statusCode() + " - " + response.body());
        }

        System.out.println("Jira description updated successfully for " + issueKey);
    }

    /**
     * Attaches JSON as file to Jira issue
     */
    public void attachJsonFile(String issueKey, String jsonContent) {
        String url = jiraConfig.getBaseUrl() + "/rest/api/2/issue/" + issueKey + "/attachments";

        File tempFile = null;
        try {
            try {
//                tempFile = Files.createTempFile("testData-" + issueKey, ".json").toFile();
                // Create a file with a fixed name instead of random suffix
                String fileName = "testData_" + issueKey + ".json";
                tempFile = new File(System.getProperty("java.io.tmpdir"), fileName);

                try (FileWriter writer = new FileWriter(tempFile)) {
                    writer.write(jsonContent);
                }

            } catch (IOException e) {
                System.err.println("Failed to create or write temporary JSON file: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Error while creating temp JSON file", e);
            }

            // Create multipart body
            var boundary = "----JiraBoundary" + System.currentTimeMillis();
            byte[] byteArray = null;
            try {
                byteArray = buildMultipartBody(boundary, tempFile);
            } catch (IOException e) {
                throw new RuntimeException(e);
            }

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", buildAuthHeader())
                .header("X-Atlassian-Token", "no-check")
                .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(byteArray))
                .build();

            HttpResponse<String> response = null;
            try {
                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            } catch (IOException e) {
                throw new RuntimeException(e);
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }

            if (response.statusCode() / 100 != 2) {
                throw new RuntimeException("Failed to attach JSON file: " + response.statusCode() + " - " + response.body());
            }

            System.out.println("JSON file attached to " + issueKey);
        } finally {
            if (tempFile != null && tempFile.exists()) tempFile.delete();
        }
    }

    private String buildAuthHeader() {
        String creds = jiraConfig.getUsername() + ":" + jiraConfig.getToken();
        return "Bearer " + jiraConfig.getToken();
    }

//    private byte[] buildMultipartBody(String boundary, File file) throws IOException {
//        String fileHeader = "--" + boundary + "\r\n"
//            + "Content-Disposition: form-data; name=\"file\"; filename=\"" + file.getName() + "\"\r\n"
//            + "Content-Type: application/json\r\n\r\n";
//        String fileFooter = "\r\n--" + boundary + "--\r\n";
//
//        byte[] fileBytes = Files.readAllBytes(file.toPath());
//        byte[] headerBytes = fileHeader.getBytes();
//        byte[] footerBytes = fileFooter.getBytes();
//
//        byte[] result = new byte[headerBytes.length + fileBytes.length + footerBytes.length];
//        System.arraycopy(headerBytes, 0, result, 0, headerBytes.length);
//        System.arraycopy(fileBytes, 0, result, headerBytes.length, fileBytes.length);
//        System.arraycopy(footerBytes, 0, result, headerBytes.length + fileBytes.length, footerBytes.length);
//        return result;
//    }

    private byte[] buildMultipartBody(String boundary, File file) throws IOException {
        final String LINE_FEED = "\r\n";

        StringBuilder sb = new StringBuilder();
        sb.append("--").append(boundary).append(LINE_FEED);
        sb.append("Content-Disposition: form-data; name=\"file\"; filename=\"")
            .append(file.getName()).append("\"").append(LINE_FEED);
        sb.append("Content-Type: application/json").append(LINE_FEED);
        sb.append(LINE_FEED); // Empty line before file content

        byte[] fileBytes = Files.readAllBytes(file.toPath());
        byte[] headerBytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        byte[] footerBytes = (LINE_FEED + "--" + boundary + "--" + LINE_FEED).getBytes(StandardCharsets.UTF_8);

        byte[] result = new byte[headerBytes.length + fileBytes.length + footerBytes.length];
        System.arraycopy(headerBytes, 0, result, 0, headerBytes.length);
        System.arraycopy(fileBytes, 0, result, headerBytes.length, fileBytes.length);
        System.arraycopy(footerBytes, 0, result, headerBytes.length + fileBytes.length, footerBytes.length);

        return result;
    }

}


//
//import com.nakivo.testgen.config.JiraConfig;
//import org.springframework.core.io.FileSystemResource;
//import org.springframework.http.MediaType;
//import org.springframework.http.client.MultipartBodyBuilder;
//import org.springframework.stereotype.Service;
//import org.springframework.web.reactive.function.client.WebClient;
//import reactor.core.publisher.Mono;
//
//import java.io.File;
//import java.io.FileWriter;
//import java.io.IOException;
//import java.nio.file.Files;
//
//@Service
//public class JiraService {
//
//    private final WebClient webClient;
//    private final JiraConfig jiraConfig;
//
//    public JiraService(JiraConfig jiraConfig) {
//        this.jiraConfig = jiraConfig;
//
//        String basicAuth = java.util.Base64.getEncoder().encodeToString(
//            (jiraConfig.getUsername() + ":" + jiraConfig.getToken()).getBytes()
//        );
//
//        this.webClient = WebClient.builder()
//            .baseUrl(jiraConfig.getBaseUrl())
//            .defaultHeader("Authorization", "Basic " + basicAuth)
//            .defaultHeader("Accept", "application/json")
//            .build();
//    }
//
//    /**
//     * ✅ Update Jira issue description
//     */
//    public void updateDescription(String issueKey, String newDescription) {
//        String url = "/rest/api/3/issue/" + issueKey;
//
//        String body = String.format(
//            "{\"fields\": {\"description\": \"%s\"}}",
//            escapeJson(newDescription)
//        );
//
//        webClient.put()
//            .uri(url)
//            .contentType(MediaType.APPLICATION_JSON)
//            .bodyValue(body)
//            .retrieve()
//            .bodyToMono(String.class)
//            .doOnError(e -> System.err.println("❌ Failed to update description: " + e.getMessage()))
//            .block(); // block for simplicity
//    }
//
//    /**
//     * ✅ Attach JSON file to Jira issue
//     */
//    public void attachJsonFile(String issueKey, String jsonContent) {
//        String url = "/rest/api/3/issue/" + issueKey + "/attachments";
//
//        File tempFile = null;
//        try {
//            tempFile = Files.createTempFile("jira-", ".json").toFile();
//            try (FileWriter writer = new FileWriter(tempFile)) {
//                writer.write(jsonContent);
//            }
//
//            MultipartBodyBuilder builder = new MultipartBodyBuilder();
//            builder.part("file", new FileSystemResource(tempFile))
//                .filename(tempFile.getName())
//                .contentType(MediaType.APPLICATION_JSON);
//
//            webClient.post()
//                .uri(url)
//                .contentType(MediaType.MULTIPART_FORM_DATA)
//                .header("X-Atlassian-Token", "no-check")
//                .bodyValue(builder.build())
//                .retrieve()
//                .bodyToMono(String.class)
//                .doOnSuccess(r -> System.out.println("✅ JSON attached successfully"))
//                .doOnError(e -> System.err.println("❌ Failed to attach JSON: " + e.getMessage()))
//                .block();
//
//        } catch (IOException e) {
//            throw new RuntimeException("Error while creating or writing temp JSON file", e);
//        } finally {
//            if (tempFile != null && tempFile.exists()) {
//                tempFile.delete();
//            }
//        }
//    }
//
//    /**
//     * Escape JSON special characters
//     */
//    private String escapeJson(String text) {
//        if (text == null) return "";
//        return text
//            .replace("\\", "\\\\")
//            .replace("\"", "\\\"")
//            .replace("\n", "\\n");
//    }
//}


//
//import com.nakivo.testgen.config.JiraConfig;
//import org.springframework.http.HttpEntity;
//import org.springframework.http.HttpHeaders;
//import org.springframework.http.HttpMethod;
//import org.springframework.http.MediaType;
//import org.springframework.http.ResponseEntity;
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.RestTemplate;
//
//import java.io.File;
//import java.io.FileWriter;
//import java.io.IOException;
//import java.nio.file.Files;
//import java.util.Map;
//
//@Service
//public class JiraService {
//
//    private final JiraConfig jiraConfig;
//
//    private final RestTemplate restTemplate = new RestTemplate();
//
//    public JiraService(JiraConfig jiraConfig) {
//        this.jiraConfig = jiraConfig;
//    }
//
//    /**
//     * Update Jira issue description.
//     */
//    public void updateDescription(String issueKey, String newDescription) {
//        String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueKey;
//
//        // Jira expects "update" or "fields"
//        Map<String, Object> body = Map.of(
//            "fields", Map.of("description", newDescription)
//        );
//
//        HttpHeaders headers = createAuthHeaders();
//        headers.setContentType(MediaType.APPLICATION_JSON);
//
//        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
//        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
//
//        if (!response.getStatusCode().is2xxSuccessful()) {
//            throw new RuntimeException("Failed to update description: " + response.getBody());
//        }
//    }
//
//    /**
//     * Attach JSON as a file to the Jira issue.
//     */
//    public void attachJsonFile(String issueKey, String jsonContent) {
//        String url = jiraConfig.getBaseUrl() + "/rest/api/3/issue/" + issueKey + "/attachments";
//
//        // Create temp JSON file
////        File tempFile = Files.createTempFile("jira-", ".json").toFile();
////        try (FileWriter writer = new FileWriter(tempFile)) {
////            writer.write(jsonContent);
////        }
//
//        File tempFile = null;
//        try {
//            tempFile = Files.createTempFile("jira-", ".json").toFile();
//
//            try (FileWriter writer = new FileWriter(tempFile)) {
//                writer.write(jsonContent);
//            }
//
//        } catch (IOException e) {
//            System.err.println("Failed to create or write temporary JSON file: " + e.getMessage());
//            e.printStackTrace();
//            throw new RuntimeException("Error while creating temp JSON file", e);
//        }
//
//
//        HttpHeaders headers = createAuthHeaders();
//        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
//        headers.add("X-Atlassian-Token", "no-check");
//
//        var bodyBuilder = new org.springframework.util.LinkedMultiValueMap<String, Object>();
//        bodyBuilder.add("file", new org.springframework.core.io.FileSystemResource(tempFile));
//
//        HttpEntity<org.springframework.util.MultiValueMap<String, Object>> request =
//            new HttpEntity<>(bodyBuilder, headers);
//
//        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, request, String.class);
//
//        tempFile.delete();
//
//        if (!response.getStatusCode().is2xxSuccessful()) {
//            throw new RuntimeException("Failed to attach JSON file: " + response.getBody());
//        }
//    }
//
//    private HttpHeaders createAuthHeaders() {
//        HttpHeaders headers = new HttpHeaders();
//        String basicAuth = jiraConfig.getUsername() + ":" + jiraConfig.getToken();
//        String encodedAuth = java.util.Base64.getEncoder().encodeToString(basicAuth.getBytes());
//        headers.add("Authorization", "Basic " + encodedAuth);
//        return headers;
//    }
//
//}
