package com.scims.activities;

import com.scims.registrations.ActivityRegistrationRepository;
import com.scims.registrations.RegistrationStatus;
import com.scims.shared.ConflictException;
import com.scims.shared.NotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ActivityServiceTest {
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private ActivityRegistrationRepository registrationRepository;
    @InjectMocks
    private ActivityService activityService;

    @Test
    void createsActivityFromValidatedRequest() {
        ActivityRequest request = request(30);
        when(activityRepository.save(any(Activity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ActivityResponse response = activityService.create(request);

        assertEquals(request.title(), response.title());
        assertEquals(request.capacity(), response.capacity());
        assertEquals(request.eventDate(), response.eventDate());
    }

    @Test
    void refusesToLowerCapacityBelowActiveRegistrationCount() {
        Activity activity = activity(10);
        when(activityRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(activity));
        when(registrationRepository.countByActivityIdAndStatus(4L, RegistrationStatus.REGISTERED)).thenReturn(8L);

        assertThrows(ConflictException.class, () -> activityService.update(4L, request(7)));
    }

    @Test
    void refusesToDeleteActivityWithRegistrationHistory() {
        when(activityRepository.findByIdForUpdate(4L)).thenReturn(Optional.of(activity(10)));
        when(registrationRepository.existsByActivityId(4L)).thenReturn(true);

        assertThrows(ConflictException.class, () -> activityService.delete(4L));
        verify(activityRepository, never()).delete(any(Activity.class));
    }

    @Test
    void reportsMissingActivity() {
        when(activityRepository.findByIdForUpdate(4L)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> activityService.delete(4L));
    }

    private Activity activity(int capacity) {
        return new Activity("Java Workshop", "Workshop", "Details",
                LocalDateTime.of(2026, 11, 15, 10, 0), "CS Lab", capacity);
    }

    private ActivityRequest request(int capacity) {
        return new ActivityRequest("Java Workshop", "Workshop", "Details",
                LocalDateTime.of(2026, 11, 15, 10, 0), "CS Lab", capacity);
    }
}
