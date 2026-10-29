package com.scims.analytics;

import java.util.List;
import java.util.Map;

public record ActivityAnalytics(
        long totalActivities,
        long totalRegistrations,
        List<ActivitySummary> registrationsPerActivity,
        List<ActivitySummary> mostPopularActivities,
        Map<String, Long> registrationStatusCounts) {

    public record ActivitySummary(
            Long activityId,
            String activityName,
            long registrations,
            int capacity,
            int availableCapacity) {
    }
}
