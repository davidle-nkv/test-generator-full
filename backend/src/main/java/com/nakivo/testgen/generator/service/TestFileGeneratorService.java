package com.nakivo.testgen.generator.service;


import com.nakivo.testgen.github.service.GitHubFileService;
import com.nakivo.testgen.github.service.GithubExcelUpdaterService;
import com.nakivo.testgen.utils.TextParser;
import freemarker.template.Configuration;
import freemarker.template.Template;
import freemarker.template.TemplateException;
import freemarker.template.Version;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;


@Service
public class TestFileGeneratorService {

    private final GitHubFileService gitHubFileService;
    private final GithubExcelUpdaterService githubExcelUpdaterService;

    private static final String TEMPLATE_DIR = "templates";
    private static final String OUTPUT_DIR = "src/test/java/com/nakivo/tests/manual";
    private static final String DATA_INPUT_MANUAL_PATH = "propertyfiles/ui/dataInputManual.xlsx";

    public TestFileGeneratorService(GitHubFileService gitHubFileService, GithubExcelUpdaterService githubExcelUpdaterService) {
        this.gitHubFileService = gitHubFileService;
        this.githubExcelUpdaterService = githubExcelUpdaterService;
    }

    public void uploadDataInputManualToQARepo(String description, String testDataInput) {
        try {
            String sheetName = TextParser
                .parseInputText(description).get("groups").toString()
                .split(",")[0]
                .replace("\"", "").trim();
            githubExcelUpdaterService.updateExcelOnGithub(DATA_INPUT_MANUAL_PATH, sheetName, testDataInput);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    public Map<String, String> generateFromText(String textInput) throws IOException, TemplateException {
        Map<String, Object> data = TextParser.parseInputText(textInput);
        return generateTestContent(data);
    }

    private Map<String, String> generateTestContent(Map<String, Object> data)
        throws IOException, TemplateException {

        Map<String, String> result = new HashMap<>();

        String title = (String) data.get("title");
        String groups = (String) data.get("groups");
        String id = (String) data.get("id");
        String category = (String) data.getOrDefault("category", "VMwareBackup");
        String feature = (String) data.getOrDefault("feature", "VMWAREBACKUP");
        @SuppressWarnings("unchecked")
        List<String> steps = (List<String>) data.get("steps");

        // Setup FreeMarker
        Configuration cfg = new Configuration(new Version("2.3.29"));
        cfg.setClassLoaderForTemplateLoading(getClass().getClassLoader(), TEMPLATE_DIR);
        cfg.setDefaultEncoding("UTF-8");

        Template classTemplate = cfg.getTemplate("class_template.ftl");
        Template methodTemplate = cfg.getTemplate("method_template.ftl");

        // Prepare step data
        List<Map<String, String>> stepData = new ArrayList<>();
        for (String s : steps) {
            Map<String, String> st = new HashMap<>();
            st.put("text", s);
            st.put("methodCall", mapToMethod(s));
            stepData.add(st);
        }

        // Create a method using template
        Map<String, Object> methodCtx = new HashMap<>();
        methodCtx.put("id", id);
        methodCtx.put("groups", groups);
        methodCtx.put("firstGroup", groups.split(",")[0].trim());
        methodCtx.put("description", title);
        methodCtx.put("feature", feature);
        methodCtx.put("steps", stepData);

        StringWriter methodOut = new StringWriter();
        methodTemplate.process(methodCtx, methodOut);
        String methodContent = methodOut.toString();

        // --- Write or update the test class file ---
        String className = category + "ManualTest";
        File file = null;
        String targetFilePath = OUTPUT_DIR + "/" + className + ".java";
        try {
            file = gitHubFileService.getFileFromGithub(targetFilePath);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }

        String updatedContent = null;

        if (file.exists()) {
            updatedContent = updateOrAppendMethod(file, methodContent, id, className);
        } else {
            // Create a new class using template
            Map<String, Object> classCtx = new HashMap<>();
            classCtx.put("packageName", "com.nakivo.tests.manual");
            classCtx.put("className", className);
            classCtx.put("category", category);
            classCtx.put("testMethods", Arrays.asList(methodContent));

            StringWriter classOut = new StringWriter();
            classTemplate.process(classCtx, classOut);
            updatedContent = classOut.toString();
            System.out.println("[INFO] Created new test class: " + className);
            writeFile(file.getPath(), updatedContent);
        }

        return Map.of("path", targetFilePath, "content", updatedContent);
    }

    // --- New: CSV path + loader replacing the hardcoded map ---
    private static final String STEP_MAPPINGS_CSV_PATH = "step-mappings.csv";
    private final Map<String, String> STEP_MAPPINGS = loadStepMappings();

    // --- CSV Loader Implementation ---
    private Map<String, String> loadStepMappings() {
        InputStream csvStream = getClass().getClassLoader().getResourceAsStream("step-mappings.csv");
        if (csvStream == null) {
            throw new IllegalStateException("Step mappings CSV not found at: " + STEP_MAPPINGS_CSV_PATH);
        }
        Map<String, String> map = new LinkedHashMap<>();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(csvStream, StandardCharsets.UTF_8))) {
            String line;
            int lineNum = 0;
            while ((line = br.readLine()) != null) {
                lineNum++;
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                // Basic CSV split (first comma separates key and method). Supports quoted key/value.
                String key;
                String value;

                int commaPos = findFirstCommaOutsideQuotes(line);
                if (commaPos < 0) {
                    throw new IllegalStateException("Invalid CSV format (missing comma) at line " + lineNum);
                }
                key = line.substring(0, commaPos).trim();
                value = line.substring(commaPos + 1).trim();

                key = unquote(key).toLowerCase(Locale.ROOT).trim();
                value = unquote(value).trim().replace("\"\"", "\""); // unescape quotes

                if (key.isEmpty() || value.isEmpty()) {
                    throw new IllegalStateException("Empty key/value at line " + lineNum);
                }
                if (map.containsKey(key)) {
                    System.out.println("[WARN] Duplicate key overwritten: " + key + " (line " + lineNum + ")");
                }
                map.put(key, value.endsWith(";") ? value : value + ";");
            }
        } catch (IOException e) {
            throw new RuntimeException("Failed to read step mappings CSV: " + e.getMessage(), e);
        }
        if (map.isEmpty()) {
            throw new IllegalStateException("Step mappings CSV is empty.");
        }
        System.out.println("[INFO] Loaded " + map.size() + " step mappings from CSV.");
        return Collections.unmodifiableMap(map);
    }

    private static int findFirstCommaOutsideQuotes(String line) {
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char c = line.charAt(i);
            if (c == '"') inQuotes = !inQuotes;
            else if (c == ',' && !inQuotes) return i;
        }
        return -1;
    }

    private static String unquote(String s) {
        s = s.trim();
        if (s.startsWith("\"") && s.endsWith("\"") && s.length() >= 2) {
            return s.substring(1, s.length() - 1);
        }
        return s;
    }

    private String mapToMethod(String step) {
        String stepDesc = step.replaceFirst("Step \\d+:\\s*", "").trim().toLowerCase();
        String bestKey = null;
        double bestScore = 0.0;

        for (String key : STEP_MAPPINGS.keySet()) {
            double score = tokenOverlap(key, stepDesc);
            if (score > bestScore) {
                bestScore = score;
                bestKey = key;
            }
        }

        if (bestScore >= 0.5) {
            return STEP_MAPPINGS.get(bestKey);
        } else {
            throw new RuntimeException("Cannot detect method mapping for step: " + step);
        }
    }

    private static double tokenOverlap(String a, String b) {
        Set<String> sa = new HashSet<String>(Arrays.asList(a.split("\\s+")));
        Set<String> sb = new HashSet<String>(Arrays.asList(b.split("\\s+")));
        int common = 0;
        for (String s : sa) {
            if (sb.contains(s)) common++;
        }
        return (2.0 * common) / (sa.size() + sb.size());
    }

    /* Replace / append test method safely (brace-aware).
       file: File object for the target Java file
       methodContent: full method text (including annotations and body)
       id: test case id (e.g. "TC_001")
       className: the Java class name (e.g. "VMwareBackupManualTest")
    */
    private static String updateOrAppendMethod(File file, String methodContent, String id, String className) throws IOException {
        String existing = readFile(file.getPath());
        String updated = existing;
        boolean replaced = false;

        // 1) Try to find annotation-based method: find the annotation preceding the id literal
        int idLiteralPos = existing.indexOf("\"" + id + "\"");
        if (idLiteralPos != -1) {
            int annStart = existing.lastIndexOf("@FrameworkAnnotation", idLiteralPos);
            if (annStart != -1) {
                // find method signature after the annotation (search from annStart)
                Pattern sigPattern = Pattern.compile("public\\s+void\\s+" + Pattern.quote(id) + "\\s*\\(", Pattern.CASE_INSENSITIVE);
                Matcher sigMatcher = sigPattern.matcher(existing);
                if (sigMatcher.find(idLiteralPos)) {
                    int sigPos = sigMatcher.start();
                    int methodEnd = findMethodEnd(existing, sigPos);
                    if (methodEnd != -1) {
                        // replace from annotation start to methodEnd (inclusive)
                        updated = existing.substring(0, annStart) + methodContent + existing.substring(methodEnd + 1);
                        replaced = true;
                        System.out.println("[INFO] Replaced annotated method for id: " + id);
                    }
                } else {
                    // last resort: search signature after annStart
                    sigMatcher = sigPattern.matcher(existing.substring(annStart));
                    if (sigMatcher.find()) {
                        int sigPos = annStart + sigMatcher.start();
                        int methodEnd = findMethodEnd(existing, sigPos);
                        if (methodEnd != -1) {
                            updated = existing.substring(0, annStart) + methodContent + existing.substring(methodEnd + 1);
                            replaced = true;
                            System.out.println("[INFO] Replaced annotated method (fallback) for id: " + id);
                        }
                    }
                }
            }
        }

        // 2) Fallback: find method signature only (public void ID(...){ ... })
        if (!replaced) {
            Pattern sigOnly = Pattern.compile("public\\s+void\\s+" + Pattern.quote(id) + "\\s*\\(", Pattern.CASE_INSENSITIVE);
            Matcher m = sigOnly.matcher(existing);
            if (m.find()) {
                int sigPos = m.start();
                // if there is an annotation before signature, prefer to remove annotation block too
                int annBefore = existing.lastIndexOf("@FrameworkAnnotation", sigPos);
                int replaceStart = annBefore >= 0 ? annBefore : sigPos;

                int methodEnd = findMethodEnd(existing, sigPos);
                if (methodEnd != -1) {
                    updated = existing.substring(0, replaceStart) + methodContent + existing.substring(methodEnd + 1);
                    replaced = true;
                    System.out.println("[INFO] Replaced existing method by signature for id: " + id);
                }
            }
        }

        // 3) If not found, append before the class closing brace (preserve it)
        if (!replaced) {
            int classPos = existing.indexOf("class " + className);
            int insertPos = -1;
            if (classPos >= 0) {
                int openBrace = existing.indexOf('{', classPos);
                if (openBrace >= 0) {
                    int classEnd = findMatchingBrace(existing, openBrace);
                    if (classEnd >= 0) insertPos = classEnd;
                }
            }
            if (insertPos < 0) {
                // fallback: last '}' in file
                insertPos = existing.lastIndexOf('}');
            }
            if (insertPos >= 0) {
                String before = existing.substring(0, insertPos);
                String after = existing.substring(insertPos); // includes the final brace
                updated = before + "\n\n" + methodContent + "\n" + after;
                System.out.println("[INFO] Appended new test method before class end: " + id);
            } else {
                // completely malformed, append and add a closing brace
                updated = existing + "\n\n" + methodContent + "\n}";
                System.out.println("[WARN] Could not find class end; appended method and added closing brace: " + id);
            }
        }

        // Normalize newlines and remove redundant trailing lines
        updated = updated.replaceAll("\r\n", "\n")
            .replaceAll("(?m)^[ \t]*\n{3,}", "\n\n")   // collapse >2 blank lines
            .replaceAll("[ \t]+$", "");               // trim trailing spaces

        // Persist
        writeFile(file.getPath(), updated.trim() + "\n");

        return updated.trim() + "\n";
    }

    /* Find the index of the '}' that closes the method that starts at the method signature position.
       Returns index of the closing '}' (0-based), or -1 if not found. */
    private static int findMethodEnd(String content, int signaturePos) {
        int len = content.length();
        // find first '{' after signaturePos
        int bracePos = content.indexOf('{', signaturePos);
        if (bracePos < 0) return -1;

        int depth = 0;
        boolean inSingle = false;
        boolean inDouble = false;
        boolean inLineComment = false;
        boolean inBlockComment = false;

        for (int i = bracePos; i < len; i++) {
            char c = content.charAt(i);
            char next = (i + 1 < len) ? content.charAt(i + 1) : '\0';

            // handle exiting line comment
            if (inLineComment) {
                if (c == '\n') inLineComment = false;
                continue;
            }
            // handle exiting block comment
            if (inBlockComment) {
                if (c == '*' && next == '/') { inBlockComment = false; i++; continue; }
                else continue;
            }
            // handle string/char escapes
            if (inSingle) {
                if (c == '\\' && i + 1 < len) { i++; continue; }
                if (c == '\'') inSingle = false;
                continue;
            }
            if (inDouble) {
                if (c == '\\' && i + 1 < len) { i++; continue; }
                if (c == '"') inDouble = false;
                continue;
            }

            // not in any special state
            if (c == '/' && next == '/') { inLineComment = true; i++; continue; }
            if (c == '/' && next == '*') { inBlockComment = true; i++; continue; }
            if (c == '\'') { inSingle = true; continue; }
            if (c == '"') { inDouble = true; continue; }

            if (c == '{') {
                depth++;
            } else if (c == '}') {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    /* Find the matching closing brace index for an opening brace at openPos.
       Returns index of matching '}', or -1 if not found. Uses same quote/comment-aware scan. */
    private static int findMatchingBrace(String content, int openPos) {
        int len = content.length();
        if (openPos < 0 || openPos >= len || content.charAt(openPos) != '{') return -1;

        int depth = 1;
        boolean inSingle = false;
        boolean inDouble = false;
        boolean inLineComment = false;
        boolean inBlockComment = false;

        for (int i = openPos + 1; i < len; i++) {
            char c = content.charAt(i);
            char next = (i + 1 < len) ? content.charAt(i + 1) : '\0';

            if (inLineComment) {
                if (c == '\n') inLineComment = false;
                continue;
            }
            if (inBlockComment) {
                if (c == '*' && next == '/') { inBlockComment = false; i++; continue; }
                else continue;
            }
            if (inSingle) {
                if (c == '\\' && i + 1 < len) { i++; continue; }
                if (c == '\'') inSingle = false;
                continue;
            }
            if (inDouble) {
                if (c == '\\' && i + 1 < len) { i++; continue; }
                if (c == '"') inDouble = false;
                continue;
            }

            if (c == '/' && next == '/') { inLineComment = true; i++; continue; }
            if (c == '/' && next == '*') { inBlockComment = true; i++; continue; }
            if (c == '\'') { inSingle = true; continue; }
            if (c == '"') { inDouble = true; continue; }

            if (c == '{') depth++;
            else if (c == '}') {
                depth--;
                if (depth == 0) return i;
            }
        }
        return -1;
    }

    private static String readFile(String path) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(new FileInputStream(path), "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line).append("\n");
        br.close();
        return sb.toString();
    }

    private static void writeFile(String path, String content) throws IOException {
        System.out.println("[INFO] Writing to file: " + path);

        BufferedWriter bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(path), "UTF-8"));
        bw.write(content);
        bw.close();
    }

}
