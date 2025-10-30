package com.nakivo.testgen.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "github")
public class GitHubConfig {
    private String owner;
    private String repo;
    private String branch;
    private String pat;

    public String getOwner() { return owner; }
    public void setOwner(final String owner) { this.owner = owner; }

    public String getRepo() { return repo; }
    public void setRepo(final String repo) { this.repo = repo; }

    public String getBranch() { return branch; }
    public void setBranch(final String branch) { this.branch = branch; }

    public String getPat() { return pat; }
    public void setPat(final String pat) { this.pat = pat; }

}
