package com.nakivo.testgen.jira.controller;


import com.nakivo.testgen.jira.service.JiraService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;


@RestController
@RequestMapping("/api/jira")
public class JiraController {

    private final JiraService jiraService;

    public JiraController(JiraService jiraService) {
        this.jiraService = jiraService;
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateJira(@RequestBody Map<String, Object> payload) {
        String ticket = (String) payload.get("ticket");
        String description = (String) payload.get("description");
        String json = (String) payload.get("json");

        // Example: update Jira via REST API
        jiraService.updateDescription(ticket, description);
        jiraService.attachJsonFile(ticket, json);

        return ResponseEntity.ok(Map.of("status", "updated"));
    }

}
