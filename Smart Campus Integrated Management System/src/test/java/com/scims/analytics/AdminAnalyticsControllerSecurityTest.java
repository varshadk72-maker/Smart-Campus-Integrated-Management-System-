package com.scims.analytics;

import com.scims.registrations.RegistrationService;
import com.scims.security.SecurityConfig;
import com.scims.shared.ApiExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = AdminAnalyticsController.class,
        properties = "scims.security.jwt.secret=0123456789abcdef0123456789abcdef")
@Import({SecurityConfig.class, ApiExceptionHandler.class})
class AdminAnalyticsControllerSecurityTest {
    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private AdminAnalyticsService analyticsService;
    @MockitoBean
    private RegistrationService registrationService;
    @MockitoBean
    private CsvExportService csvExportService;

    @Test
    void analyticsAreAdminOnly() throws Exception {
        mockMvc.perform(get("/api/admin/activities/analytics")
                        .with(jwt().authorities(() -> "ROLE_STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanDownloadRegistrationCsv() throws Exception {
        when(registrationService.findAll()).thenReturn(List.of());
        when(csvExportService.exportRegistrations(List.of()))
                .thenReturn("Registration ID,Activity name,Student ID,Registration date,Registration status\r\n");

        mockMvc.perform(get("/api/admin/reports/activities/registrations.csv")
                        .with(jwt().authorities(() -> "ROLE_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.parseMediaType("text/csv")))
                .andExpect(header().string("Content-Disposition",
                        "attachment; filename=\"activity-registrations.csv\""));
    }
}
