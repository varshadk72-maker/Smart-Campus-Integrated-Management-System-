package com.scims.registrations;

import com.scims.activities.Activity;
import com.scims.activities.ActivityRepository;
import com.scims.shared.ConflictException;
import com.scims.shared.ForbiddenException;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {
    @Mock
    private ActivityRepository activityRepository;
    @Mock
    private ActivityRegistrationRepository registrationRepository;
    @InjectMocks
    private RegistrationService registrationService;

    @Test
    void rejectsDuplicateRegistration() {
        Activity activity = activity(10);
        ActivityRegistration existing = new ActivityRegistration(activity, 22L);
        when(activityRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(activity));
        when(registrationRepository.findByActivityIdAndStudentId(5L, 22L)).thenReturn(Optional.of(existing));

        assertThrows(ConflictException.class, () -> registrationService.register(5L, 22L));
    }

    @Test
    void rejectsRegistrationWhenCapacityIsFull() {
        when(activityRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(activity(2)));
        when(registrationRepository.findByActivityIdAndStudentId(5L, 22L)).thenReturn(Optional.empty());
        when(registrationRepository.countByActivityIdAndStatus(5L, RegistrationStatus.REGISTERED)).thenReturn(2L);

        assertThrows(ConflictException.class, () -> registrationService.register(5L, 22L));
    }

    @Test
    void acceptsRegistrationWhenSpaceIsAvailable() {
        Activity activity = activity(2);
        when(activityRepository.findByIdForUpdate(5L)).thenReturn(Optional.of(activity));
        when(registrationRepository.findByActivityIdAndStudentId(5L, 22L)).thenReturn(Optional.empty());
        when(registrationRepository.countByActivityIdAndStatus(5L, RegistrationStatus.REGISTERED)).thenReturn(1L);
        when(registrationRepository.save(any(ActivityRegistration.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        RegistrationResponse response = registrationService.register(5L, 22L);

        assertEquals(22L, response.studentId());
        assertEquals(RegistrationStatus.REGISTERED, response.status());
    }

    @Test
    void cancellationOnlyAllowsTheOwningStudent() {
        ActivityRegistration registration = new ActivityRegistration(activity(2), 22L);
        when(registrationRepository.findById(9L)).thenReturn(Optional.of(registration));

        assertThrows(ForbiddenException.class, () -> registrationService.cancel(9L, 23L));
    }

    @Test
    void cancelsOwnedRegistrationAndFreesItsCapacity() {
        ActivityRegistration registration = new ActivityRegistration(activity(2), 22L);
        when(registrationRepository.findById(9L)).thenReturn(Optional.of(registration));

        RegistrationResponse response = registrationService.cancel(9L, 22L);

        assertEquals(RegistrationStatus.CANCELLED, response.status());
        verify(registrationRepository).findById(9L);
    }

    private Activity activity(int capacity) {
        return new Activity("Java Workshop", "Workshop", "Details",
                LocalDateTime.of(2026, 11, 15, 10, 0), "CS Lab", capacity);
    }
}
