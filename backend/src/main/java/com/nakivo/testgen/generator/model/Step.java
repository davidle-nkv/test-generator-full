package com.nakivo.testgen.generator.model;

import java.util.Map;

public class Step {
    private String stepText;
    private Map<String, String> parameters;

    public String getStepText() {
        return stepText;
    }

    public void setStepText(String stepText) {
        this.stepText = stepText;
    }

    public Map<String, String> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, String> parameters) {
        this.parameters = parameters;
    }
}

