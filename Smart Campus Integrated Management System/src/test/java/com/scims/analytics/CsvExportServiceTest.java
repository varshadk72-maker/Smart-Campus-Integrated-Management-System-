package com.scims.analytics;

import com.scims.registrations.RegistrationResponse;
import com.scims.registrations.RegistrationStatus;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class CsvExportServiceTest {
    private final CsvExportService csvExportService = new CsvExportService();

    @Test
    void escapesQuotesAndProtectsSpreadsheetFormulaPrefixes() {
        String csv = csvExportService.exportRegistrations(List.of(
                new RegistrationResponse(3L, 8L, "=HYPERLINK(\"bad\")", 24L,
                        LocalDateTime.of(2026, 11, 15, 10, 0), RegistrationStatus.REGISTERED)));

        assertTrue(csv.contains("\"'=HYPERLINK(\"\"bad\"\")\""));
        assertTrue(csv.startsWith("Registration ID,Activity name,Student ID,Registration date,Registration status\r\n"));
    }
}
