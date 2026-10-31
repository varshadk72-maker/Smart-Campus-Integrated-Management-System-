package com.scims.activities;

import java.time.LocalDateTime;

public record ActivityResponse(
        Long id,
        String title,
        String category,
        String venue,
        LocalDateTime eventDate,
        String description,
        Integer capacity,
        LocalDateTime createdAt,
        Boolean registered) {
    static ActivityResponse from(Activity activity, Boolean registered) {
        return new ActivityResponse(
                activity.getId(),
                activity.getActivityName(),
                activity.getCategory(),
                activity.getLocation(),
                activity.getActivityDate(),
                activity.getDescription(),
                activity.getCapacity(),
                activity.getCreatedAt(),
                registered);
    }
}
