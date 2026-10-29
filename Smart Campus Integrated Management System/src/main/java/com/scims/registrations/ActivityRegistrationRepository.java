package com.scims.registrations;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ActivityRegistrationRepository extends JpaRepository<ActivityRegistration, Long> {
    long countByActivityIdAndStatus(Long activityId, RegistrationStatus status);

    long countByStatus(RegistrationStatus status);

    boolean existsByActivityId(Long activityId);

    boolean existsByActivityIdAndStudentIdAndStatus(Long activityId, Long studentId, RegistrationStatus status);

    Optional<ActivityRegistration> findByActivityIdAndStudentId(Long activityId, Long studentId);

    List<ActivityRegistration> findAllByStudentIdOrderByRegisteredAtDesc(Long studentId);

    List<ActivityRegistration> findAllByOrderByRegisteredAtDesc();
}
