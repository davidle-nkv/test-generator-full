package com.nakivo.testgen.controller;


import com.nakivo.testgen.service.CsvProxyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/files")
public class CsvProxyController {

    private final CsvProxyService csvProxyService;

    public CsvProxyController(CsvProxyService csvProxyService) {
        this.csvProxyService = csvProxyService;
    }

    @GetMapping(value = "/{filename}", produces = "text/csv")
    public ResponseEntity<String> getCsv(@PathVariable String filename) {
        if (!filename.equals("step-mappings.csv") && !filename.equals("test-data-fields.csv")) {
            return ResponseEntity.badRequest().build();
        }

        String csvData = csvProxyService.getCsvContent(filename);
        return ResponseEntity.ok(csvData);
    }

}
