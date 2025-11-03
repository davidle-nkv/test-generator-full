package com.nakivo.testgen.generator.controller;

import com.nakivo.testgen.generator.model.TestGenRequest;
import com.nakivo.testgen.generator.service.TestFileGeneratorService;
import freemarker.template.TemplateException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/testgen")
public class TestFileGeneratorController {

    private TestFileGeneratorService testFileGeneratorService;

    public TestFileGeneratorController(TestFileGeneratorService testFileGeneratorService) {
        this.testFileGeneratorService = testFileGeneratorService;
    }

    @PostMapping
    public ResponseEntity<?> generateTest(@RequestBody TestGenRequest req) {
        try {
            Map<String, String> result = testFileGeneratorService.generateFromText(req.getDescription());
            return ResponseEntity.ok(result);
        } catch (IOException | TemplateException e) {
            return ResponseEntity.internalServerError()
                .body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", e.getMessage()));
        }
    }

}
