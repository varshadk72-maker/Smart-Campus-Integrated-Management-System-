package com.scims.analytics;

import com.scims.registrations.RegistrationResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CsvExportService {
    public String exportRegistrations(List<RegistrationResponse> registrations) {
        StringBuilder csv = new StringBuilder(
                "Registration ID,Activity name,Student ID,Registration date,Registration status\r\n");
        for (RegistrationResponse registration : registrations) {
            appendRow(csv, registration.id(), registration.activityName(), registration.studentId(),
                    registration.registrationDate(), registration.status());
        }
        return csv.toString();
    }

    private void appendRow(StringBuilder csv, Object... fields) {
        for (int index = 0; index < fields.length; index++) {
            if (index > 0) {
                csv.append(',');
            }
            csv.append(escape(fields[index] == null ? "" : fields[index].toString()));
        }
        csv.append("\r\n");
    }

    private String escape(String value) {
        if (!value.isEmpty() && "=+-@\t\r".indexOf(value.charAt(0)) >= 0) {
            value = "'" + value;
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
