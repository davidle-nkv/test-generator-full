package ${packageName};

import static com.nakivo.common.Constants.*;
import static com.nakivo.utils.selenium.WaitUtils.*;
import static com.nakivo.utils.extentreports.HtmlLogs.*;
import static com.nakivo.utils.others.DateTimeUtils.getCurrentTimeStamp;

import com.nakivo.anotations.FrameworkAnnotation;
import com.nakivo.drivers.ui.TestData;
import com.nakivo.enums.*;
import com.nakivo.pages.backup.vmwarevspherebackup.${category}Page;
import org.testng.annotations.Test;

public class ${className} extends ${category}Page {

<#list testMethods as method>
    ${method}
</#list>

}
