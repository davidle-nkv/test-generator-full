package com.nakivo.testgen;

import com.nakivo.testgen.config.GitHubConfig;
import com.nakivo.testgen.config.JiraConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({GitHubConfig.class, JiraConfig.class})
public class TestGenApplication {
    public static void main(String[] args) {
        SpringApplication.run(TestGenApplication.class, args);
    }
}
