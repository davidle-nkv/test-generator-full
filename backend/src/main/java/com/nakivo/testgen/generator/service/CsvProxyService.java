package com.nakivo.testgen.generator.service;

import com.nakivo.testgen.github.service.GitHubFileService;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class CsvProxyService {

    private final GitHubFileService gitHubFileService;

    private static final String FOLDER_PATH = "shared-data";

    public CsvProxyService(GitHubFileService gitHubFileService) {
        this.gitHubFileService = gitHubFileService;
    }

    public String getCsvContent(String fileName) {
        String fileContent;
        String filePath = FOLDER_PATH + "/" + fileName;
        try {
            fileContent = gitHubFileService.getFileContentFromGithub(filePath);
            if (fileContent != null) {
                return fileContent;
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        return "";
    }
}
