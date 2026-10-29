package com.scims.activities;

import com.scims.registrations.ActivityRegistrationRepository;
import com.scims.registrations.RegistrationStatus;
import com.scims.shared.ConflictException;
import com.scims.shared.NotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ActivityService {
    private final ActivityRepository activityRepository;
    private final ActivityRegistrationRepository registrationRepository;

    public ActivityService(ActivityRepository activityRepository,
                           ActivityRegistrationRepository registrationRepository) {
        this.activityRepository = activityRepository;
        this.registrationRepository = registrationRepository;
    }

    @Transactional
    public ActivityResponse create(ActivityRequest request) {
        Activity activity = new Activity(request.title().trim(), request.category().trim(),
                request.description(), request.eventDate(), request.venue().trim(), request.capacity());
        return ActivityResponse.from(activityRepository.save(activity), null);
    }

    @Transactional(readOnly = true)
    public List<ActivityResponse> findAll(Long studentId) {
        return activityRepository.findAllByOrderByActivityDateAsc().stream()
                .map(activity -> ActivityResponse.from(activity, registered(activity.getId(), studentId)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ActivityResponse findById(Long id, Long studentId) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Activity not found."));
        return ActivityResponse.from(activity, registered(id, studentId));
    }

    @Transactional
    public ActivityResponse update(Long id, ActivityRequest request) {
        Activity activity = activityRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Activity not found."));
        long activeRegistrations = registrationRepository.countByActivityIdAndStatus(id, RegistrationStatus.REGISTERED);
        if (request.capacity() < activeRegistrations) {
            throw new ConflictException("Capacity cannot be lower than the number of active registrations.");
        }
        activity.setActivityName(request.title().trim());
        activity.setCategory(request.category().trim());
        activity.setDescription(request.description());
        activity.setActivityDate(request.eventDate());
        activity.setLocation(request.venue().trim());
        activity.setCapacity(request.capacity());
        return ActivityResponse.from(activity, null);
    }

    @Transactional
    public void delete(Long id) {
        Activity activity = activityRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("Activity not found."));
        if (registrationRepository.existsByActivityId(id)) {
            throw new ConflictException("Activity cannot be deleted while registration records exist.");
        }
        activityRepository.delete(activity);
    }

    private Boolean registered(Long activityId, Long studentId) {
        if (studentId == null) {
            return null;
        }
        return registrationRepository.existsByActivityIdAndStudentIdAndStatus(
                activityId, studentId, RegistrationStatus.REGISTERED);
    }
}
