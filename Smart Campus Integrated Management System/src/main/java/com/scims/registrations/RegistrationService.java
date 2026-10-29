package com.scims.registrations;

import com.scims.activities.Activity;
import com.scims.activities.ActivityRepository;
import com.scims.shared.ConflictException;
import com.scims.shared.ForbiddenException;
import com.scims.shared.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RegistrationService {
    private final ActivityRepository activityRepository;
    private final ActivityRegistrationRepository registrationRepository;

    public RegistrationService(ActivityRepository activityRepository,
                               ActivityRegistrationRepository registrationRepository) {
        this.activityRepository = activityRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional
    public RegistrationResponse register(Long activityId, Long studentId) {
        Activity activity = activityRepository.findByIdForUpdate(activityId)
                .orElseThrow(() -> new NotFoundException("Activity not found."));

        var existing = registrationRepository.findByActivityIdAndStudentId(activityId, studentId);
        if (existing.isPresent() && existing.get().getStatus() == RegistrationStatus.REGISTERED) {
            throw new ConflictException("You are already registered for this activity.");
        }

        long activeRegistrations = registrationRepository.countByActivityIdAndStatus(
                activityId, RegistrationStatus.REGISTERED);
        int capacity = activity.getCapacity() == null ? 0 : activity.getCapacity();
        if (activeRegistrations >= capacity) {
            throw new ConflictException("This activity has reached its capacity.");
        }

        ActivityRegistration registration = existing.orElseGet(() -> new ActivityRegistration(activity, studentId));
        registration.setStatus(RegistrationStatus.REGISTERED);
        registration.setRegisteredAt(LocalDateTime.now());
        return RegistrationResponse.from(registrationRepository.save(registration));
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> findMine(Long studentId) {
        return registrationRepository.findAllByStudentIdOrderByRegisteredAtDesc(studentId).stream()
                .map(RegistrationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> findAll() {
        return registrationRepository.findAllByOrderByRegisteredAtDesc().stream()
                .map(RegistrationResponse::from)
                .toList();
    }

    @Transactional
    public RegistrationResponse cancel(Long registrationId, Long studentId) {
        ActivityRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException("Registration not found."));
        if (!registration.getStudentId().equals(studentId)) {
            throw new ForbiddenException("You may only cancel your own registrations.");
        }
        registration.setStatus(RegistrationStatus.CANCELLED);
        return RegistrationResponse.from(registration);
    }
}
