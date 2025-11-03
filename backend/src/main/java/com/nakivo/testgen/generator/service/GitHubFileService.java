package com.nakivo.testgen.generator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nakivo.testgen.config.GitHubConfig;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.Base64;

@Service
public class GitHubFileService {

    private final GitHubConfig config;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public GitHubFileService(GitHubConfig config) {
        this.config = config;
    }

    public File getFileFromGithub(String filePath) throws IOException, InterruptedException {
        String apiUrl = "https://api.github.com/repos/" + config.getOwner() + "/" + config.getRepo() + "/contents/" + filePath + "?ref=" + config.getBranch();

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .header("Authorization", "token " + config.getPat())
            .header("Accept", "application/vnd.github+json")
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode json = objectMapper.readTree(response.body());
            String contentBase64 = json.get("content").asText().replaceAll("\n", "");
            byte[] decodedBytes = Base64.getDecoder().decode(contentBase64);

            // Create a temporary file
            File tempFile = Files.createTempFile("github_", "_" + new File(filePath).getName()).toFile();
            try (FileOutputStream fos = new FileOutputStream(tempFile)) {
                fos.write(decodedBytes);
            }

            return tempFile;
        } else if (response.statusCode() == 404) {
            System.out.println("File not found in repository: " + filePath);
            return null;
        } else {
            throw new RuntimeException("GitHub API error: " + response.statusCode() + " - " + response.body());
        }
    }

    public String getFileContentFromGithub(String filePath) throws IOException, InterruptedException {
        String apiUrl = "https://api.github.com/repos/" + config.getOwner() + "/" + config.getRepo() + "/contents/" + filePath + "?ref=" + config.getBranch();

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .header("Authorization", "token " + config.getPat())
            .header("Accept", "application/vnd.github+json")
            .GET()
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode json = objectMapper.readTree(response.body());
            String contentBase64 = json.get("content").asText().replaceAll("\n", "");
            byte[] decodedBytes = Base64.getDecoder().decode(contentBase64);
            return new String(decodedBytes, StandardCharsets.UTF_8);
        } else if (response.statusCode() == 404) {
            System.out.println("File not found in repository: " + filePath);
            return null;
        } else {
            throw new RuntimeException("GitHub API error: " + response.statusCode() + " - " + response.body());
        }
    }

}
