package com.nakivo.testgen.github.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nakivo.testgen.config.GitHubConfig;
import com.nakivo.testgen.generator.model.Step;
import com.nakivo.testgen.utils.Constants;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class GithubExcelUpdaterService {

    private GitHubConfig gitHubConfig;
    private final ObjectMapper mapper = new ObjectMapper();
    HttpClient httpClient = HttpClient.newHttpClient();

    public GithubExcelUpdaterService(GitHubConfig gitHubConfig) {
        this.gitHubConfig = gitHubConfig;
    }

    public void updateExcelOnGithub(String filePath, String sheetName, String jsonString) throws Exception {

        // Get file metadata from GitHub
        String apiUrl = String.format(
            "%s/%s/%s/contents/%s?ref=%s",
            Constants.GITHUB_API_URL, gitHubConfig.getOwner(), gitHubConfig.getRepo(), filePath, gitHubConfig.getBranch()
        );

        HttpRequest request = java.net.http.HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .header("Authorization", "token " + gitHubConfig.getPat())
            .header("Accept", "application/vnd.github+json")
            .GET()
            .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Failed to fetch file metadata: " + response.statusCode());
        }

        Map<?, ?> body = mapper.readValue(response.body(), Map.class);
        String downloadUrl = (String) body.get("download_url");
        String sha = (String) body.get("sha");

        // Download the Excel file
        HttpRequest downloadReq = HttpRequest.newBuilder()
            .uri(URI.create(downloadUrl))
            .GET()
            .build();

        HttpResponse<byte[]> downloadResp = httpClient.send(downloadReq, HttpResponse.BodyHandlers.ofByteArray());

        if (downloadResp.statusCode() != 200) {
            throw new RuntimeException("Failed to download Excel: " + downloadResp.statusCode());
        }

        byte[] xlsxBytes = downloadResp.body();

        // Modify Excel
        ByteArrayInputStream in = new ByteArrayInputStream(xlsxBytes);
        Workbook workbook = new XSSFWorkbook(in);

        // Try to get the existing sheet
        Sheet sheet = workbook.getSheet(sheetName);
        if (sheet == null) {
            sheet = workbook.createSheet(sheetName);
        }
//        else {
//            int lastRow = sheet.getLastRowNum();
//            if (lastRow > 0) {
//                // Optional: clear existing rows if you want to overwrite
//                for (int i = lastRow; i >= 0; i--) {
//                    sheet.removeRow(sheet.getRow(i));
//                }
//            }
//        }
        fillSheetFromJson(sheet, jsonString);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        workbook.write(out);
        workbook.close();

        // Upload back to GitHub
        String base64Content = Base64.getEncoder().encodeToString(out.toByteArray());

        Map<String, Object> updateBody = new HashMap<>();
        updateBody.put("message", "Auto update: added sheet " + Constants.MANUAL_SHEET);
        updateBody.put("content", base64Content);
        updateBody.put("branch", gitHubConfig.getBranch());
        updateBody.put("sha", sha);

        String updateJson = mapper.writeValueAsString(updateBody);

        HttpRequest updateReq = HttpRequest.newBuilder()
            .uri(URI.create(apiUrl))
            .header("Authorization", "Bearer " + gitHubConfig.getPat())
            .header("Accept", "application/vnd.github+json")
            .header("Content-Type", "application/json")
            .PUT(HttpRequest.BodyPublishers.ofString(updateJson, StandardCharsets.UTF_8))
            .build();

        HttpResponse<String> updateResp = httpClient.send(updateReq, HttpResponse.BodyHandlers.ofString());

        if (updateResp.statusCode() / 100 != 2) {
            throw new RuntimeException("Failed to update Excel on GitHub: " + updateResp.statusCode() + " - " + updateResp.body());
        }

        System.out.println("✅ Excel file updated successfully on GitHub.");
    }

    private void fillSheetFromJson(Sheet sheet, String jsonString) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        List<Map<String, String>> jsonList = mapper.readValue(
            jsonString, new TypeReference<List<Map<String, String>>>() {}
        );

        if (jsonList.isEmpty()) {
            throw new IllegalArgumentException("JSON input is empty.");
        }

        // We only handle the first object in your JSON array (as per your structure)
        Map<String, String> data = jsonList.get(0);

        // Create header row
        Row headerRow = sheet.createRow(0);
        int colIndex = 0;
        for (String key : data.keySet()) {
            Cell cell = headerRow.createCell(colIndex++);
            cell.setCellValue(key);
        }

        // Create data row
        Row dataRow = sheet.createRow(1);
        colIndex = 0;
        for (String key : data.keySet()) {
            Cell cell = dataRow.createCell(colIndex++);
            cell.setCellValue(data.get(key));
        }

        // Auto size columns
        for (int i = 0; i < data.size(); i++) {
            sheet.autoSizeColumn(i);
        }

        System.out.println("✅ JSON data written to sheet: " + sheet.getSheetName());
    }

}
