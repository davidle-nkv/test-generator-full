package com.nakivo.testgen.utils;


import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class TextParser {

    public static  Map<String, Object> parseInputText(String text) throws IOException {
        Map<String, Object> map = new HashMap<>();
        List<String> steps = new ArrayList<>();

        List<String> lines = Arrays.asList(text.split("\\r?\\n"));
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("#")) continue;

            if (line.toLowerCase().startsWith("title:")) {
                map.put("title", line.substring(6).trim());
            } else if (line.toLowerCase().startsWith("groups:")) {
                map.put("groups", normalizeQuotedList(line.substring(7).trim()));
            } else if (line.toLowerCase().startsWith("id:")) {
                map.put("id", line.substring(3).trim());
            } else if (line.toLowerCase().startsWith("category:")) {
                map.put("category", line.substring(9).trim());
            } else if (line.toLowerCase().startsWith("feature:")) {
                map.put("feature", line.substring(8).trim());
            } else if (line.toLowerCase().startsWith("step")) {
                steps.add(line.replaceFirst("(?i)step\\s*\\d*[:\\-]\\s*", "").trim());
            }
        }

        map.put("steps", steps);
        if (!map.containsKey("title") || !map.containsKey("groups") || !map.containsKey("id")) {
            throw new IllegalArgumentException("Input text missing required fields (id/title/groups).");
        }
        return map;
    }

    public static String normalizeQuotedList(String input) {
        if (input == null || input.isBlank()) return "";
        return Arrays.stream(input.split(","))
            .map(String::trim)
            .map(s -> s.replaceAll("['\"]", ""))  // remove existing quotes
            .filter(s -> !s.isEmpty())            // remove empty entries
            .map(s -> "\"" + s + "\"")            // wrap with double quotes
            .collect(Collectors.joining(", "));
    }
}
