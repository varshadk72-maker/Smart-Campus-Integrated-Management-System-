package com.scims.registrations;

import com.scims.activities.Activity;
import com.scims.activities.ActivityRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:scims;MODE=MySQL;DB_CLOSE_DELAY=-1",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class RegistrationRepositoryIntegrationTest {
    @Autowired
    private ActivityRepository activityRepository;
    @Autowired
    private ActivityRegistrationRepository registrationRepository;

    @Test
    void persistsRegistrationAndSupportsCapacityQueries() {
        Activity activity = saveActivity();
        registrationRepository.saveAndFlush(new ActivityRegistration(activity, 22L));

        assertEquals(1L, registrationRepository.countByActivityIdAndStatus(
                activity.getId(), RegistrationStatus.REGISTERED));
        assertTrue(registrationRepository.existsByActivityIdAndStudentIdAndStatus(
                activity.getId(), 22L, RegistrationStatus.REGISTERED));
        assertEquals(1, registrationRepository.findAllByStudentIdOrderByRegisteredAtDesc(22L).size());
    }

    @Test
    void databaseConstraintRejectsDuplicateStudentAndActivityPair() {
        Activity activity = saveActivity();
        registrationRepository.saveAndFlush(new ActivityRegistration(activity, 22L));

        assertThrows(DataIntegrityViolationException.class,
                () -> registrationRepository.saveAndFlush(new ActivityRegistration(activity, 22L)));
    }

    @Test
    void cancelledRegistrationDoesNotCountTowardCapacity() {
        Activity activity = saveActivity();
        ActivityRegistration registration = registrationRepository.saveAndFlush(
                new ActivityRegistration(activity, 22L));
        registration.setStatus(RegistrationStatus.CANCELLED);
        registrationRepository.flush();

        assertEquals(0L, registrationRepository.countByActivityIdAndStatus(
                activity.getId(), RegistrationStatus.REGISTERED));
        assertEquals(1L, registrationRepository.countByStatus(RegistrationStatus.CANCELLED));
        assertFalse(registrationRepository.existsByActivityIdAndStudentIdAndStatus(
                activity.getId(), 22L, RegistrationStatus.REGISTERED));
    }

    private Activity saveActivity() {
        return activityRepository.saveAndFlush(new Activity("Workshop", "Technical", "Details",
                LocalDateTime.of(2026, 11, 15, 10, 0), "CS Lab", 2));
    }
}
