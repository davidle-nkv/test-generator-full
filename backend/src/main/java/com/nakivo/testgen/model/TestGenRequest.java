package com.nakivo.testgen.model;


public class TestGenRequest {
    private String jiranumber;
    private String user;
    private String summary;
    private String description; // the input file text

    // Getters and Setters
    public String getJiranumber() { return jiranumber; }
    public void setJiranumber(String jiranumber) { this.jiranumber = jiranumber; }

    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
