package com.scims.analytics;

import com.scims.registrations.RegistrationResponse;
import com.scims.registrations.RegistrationService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {
    private final AdminAnalyticsService analyticsService;
    private final RegistrationService registrationService;
    private final CsvExportService csvExportService;

    public AdminAnalyticsController(AdminAnalyticsService analyticsService,
                                    RegistrationService registrationService,
                                    CsvExportService csvExportService) {
        this.analyticsService = analyticsService;
        this.registrationService = registrationService;
        this.csvExportService = csvExportService;
    }

    @GetMapping("/activities/analytics")
    public ActivityAnalytics analytics() {
        return analyticsService.getAnalytics();
    }

    @GetMapping("/stats")
    public Map<String, Long> stats() {
        ActivityAnalytics analytics = analyticsService.getAnalytics();
        return Map.of(
                "totalActivities", analytics.totalActivities(),
                "totalRegistrations", analytics.totalRegistrations());
    }

    @GetMapping("/reports/activities")
    public List<ActivityAnalytics.ActivitySummary> activityReport() {
        return analyticsService.getAnalytics().registrationsPerActivity();
    }

    @GetMapping(value = "/reports/activities/registrations.csv", produces = "text/csv")
    public ResponseEntity<byte[]> exportRegistrations() {
        List<RegistrationResponse> registrations = registrationService.findAll();
        byte[] csv = csvExportService.exportRegistrations(registrations).getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"activity-registrations.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(csv);
    }
}
