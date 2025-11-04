@FrameworkAnnotation(
      author = {AuthorType.NKV_USER},
      category = {CategoryType.DEBUG},
      date = "",
      features = {ProductType.${feature}},
      product = {Product.CORE},
      status = {Status.DONE},
      service = {},
      repository = {Repository.ONBOARD},
      testcaseId = "${id}")
    @Test(
      groups = {${groups}},
      description = "${id} - ${description}")
    public void ${id}() {
        try {
            testData = TestData.getTestDataManual(${firstGroup}, "${id}").get(0);

<#list steps as step>
            reportInfo("Step ${step_index + 1}: ${step.text}");
            ${step.methodCall}
</#list>

            reportPassed("Test case passed: ${description}");
        } catch (Exception e) {
            reportFail("Test case failed: " + e.getMessage());
        }
    }
