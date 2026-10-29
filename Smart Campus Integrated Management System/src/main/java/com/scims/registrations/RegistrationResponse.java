package com.scims.registrations;

import java.time.LocalDateTime;

public record RegistrationResponse(
        Long id,
        Long activityId,
        String activityName,
        Long studentId,
        LocalDateTime registrationDate,
        RegistrationStatus status) {
    static RegistrationResponse from(ActivityRegistration registration) {
        return new RegistrationResponse(
                registration.getId(),
                registration.getActivity().getId(),
                registration.getActivity().getActivityName(),
                registration.getStudentId(),
                registration.getRegisteredAt(),
                registration.getStatus());
    }
}
