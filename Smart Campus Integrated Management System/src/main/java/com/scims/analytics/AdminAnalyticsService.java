package com.scims.analytics;

import com.scims.activities.ActivityRepository;
import com.scims.registrations.ActivityRegistrationRepository;
import com.scims.registrations.RegistrationStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminAnalyticsService {
    private final ActivityRepository activityRepository;
    private final ActivityRegistrationRepository registrationRepository;

    public AdminAnalyticsService(ActivityRepository activityRepository,
                                 ActivityRegistrationRepository registrationRepository) {
        this.activityRepository = activityRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional(readOnly = true)
    public ActivityAnalytics getAnalytics() {
        List<ActivityAnalytics.ActivitySummary> summaries = activityRepository.findAll().stream()
                .map(activity -> {
                    long registrations = registrationRepository.countByActivityIdAndStatus(
                            activity.getId(), RegistrationStatus.REGISTERED);
                    int capacity = activity.getCapacity() == null ? 0 : activity.getCapacity();
                    return new ActivityAnalytics.ActivitySummary(activity.getId(), activity.getActivityName(),
                            registrations, capacity, Math.max(0, capacity - (int) registrations));
                })
                .toList();

        long activeRegistrations = summaries.stream()
                .mapToLong(ActivityAnalytics.ActivitySummary::registrations).sum();
        List<ActivityAnalytics.ActivitySummary> popular = summaries.stream()
                .sorted(Comparator.comparingLong(ActivityAnalytics.ActivitySummary::registrations)
                        .reversed().thenComparing(ActivityAnalytics.ActivitySummary::activityName))
                .toList();
        Map<String, Long> statusCounts = new LinkedHashMap<>();
        for (RegistrationStatus status : RegistrationStatus.values()) {
            statusCounts.put(status.name(), registrationRepository.countByStatus(status));
        }
        return new ActivityAnalytics(activityRepository.count(), activeRegistrations, summaries, popular, statusCounts);
    }
}
