package com.scims.analytics;

import com.scims.activities.ActivityRepository;
import com.scims.registrations.ActivityRegistrationRepository;
import com.scims.registrations.RegistrationStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminAnalyticsServiceTest {
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private ActivityRegistrationRepository registrationRepository;
    @InjectMocks
    private AdminAnalyticsService analyticsService;

    @Test
    void returnsActivityAndRegistrationStatusTotals() {
        when(activityRepository.findAll()).thenReturn(List.of());
        when(activityRepository.count()).thenReturn(0L);
        when(registrationRepository.countByStatus(RegistrationStatus.REGISTERED)).thenReturn(3L);
        when(registrationRepository.countByStatus(RegistrationStatus.CANCELLED)).thenReturn(1L);

        ActivityAnalytics analytics = analyticsService.getAnalytics();

        assertEquals(0, analytics.totalActivities());
        assertEquals(0, analytics.totalRegistrations());
        assertEquals(3L, analytics.registrationStatusCounts().get("REGISTERED"));
        assertEquals(1L, analytics.registrationStatusCounts().get("CANCELLED"));
    }
}
