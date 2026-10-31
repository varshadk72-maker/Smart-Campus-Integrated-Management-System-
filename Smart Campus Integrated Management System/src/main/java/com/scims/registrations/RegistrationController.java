package com.scims.registrations;

import com.scims.security.StudentIdentity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RegistrationController {
    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/activities/{activityId}/register")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('STUDENT')")
    public RegistrationResponse register(@PathVariable Long activityId, JwtAuthenticationToken authentication) {
        return registrationService.register(activityId, StudentIdentity.requiredId(authentication));
    }

    @GetMapping("/registrations/me")
    @PreAuthorize("hasRole('STUDENT')")
    public List<RegistrationResponse> findMine(JwtAuthenticationToken authentication) {
        return registrationService.findMine(StudentIdentity.requiredId(authentication));
    }

    @DeleteMapping("/registrations/{registrationId}")
    @PreAuthorize("hasRole('STUDENT')")
    public RegistrationResponse cancel(@PathVariable Long registrationId, JwtAuthenticationToken authentication) {
        return registrationService.cancel(registrationId, StudentIdentity.requiredId(authentication));
    }

    @GetMapping("/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    public List<RegistrationResponse> findAll() {
        return registrationService.findAll();
    }
}
