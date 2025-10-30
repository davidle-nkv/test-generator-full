package com.nakivo.testgen;

import com.nakivo.testgen.config.GitHubConfig;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(GitHubConfig.class)
public class TestGenApplication {
    public static void main(String[] args) {
        SpringApplication.run(TestGenApplication.class, args);
    }
}
