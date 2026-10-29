package com.scims.registrations;

import com.scims.security.SecurityConfig;
import com.scims.shared.ApiExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = RegistrationController.class,
        properties = "scims.security.jwt.secret=0123456789abcdef0123456789abcdef")
@Import({SecurityConfig.class, ApiExceptionHandler.class})
class RegistrationControllerSecurityTest {
    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private RegistrationService registrationService;

    @Test
    void registrationUsesOnlySignedInStudentClaim() throws Exception {
        when(registrationService.register(5L, 22L)).thenReturn(
                new RegistrationResponse(9L, 5L, "Workshop", 22L,
                        LocalDateTime.of(2026, 11, 1, 9, 0), RegistrationStatus.REGISTERED));

        mockMvc.perform(post("/api/activities/5/register")
                        .with(jwt().jwt(token -> token.claim("student_id", 22L))
                                .authorities(() -> "ROLE_STUDENT")))
                .andExpect(status().isCreated());

        verify(registrationService).register(5L, 22L);
    }

    @Test
    void refusesStudentTokenWithoutStudentIdentity() throws Exception {
        mockMvc.perform(post("/api/activities/5/register")
                        .with(jwt().authorities(() -> "ROLE_STUDENT")))
                .andExpect(status().isForbidden());

        verify(registrationService, never()).register(5L, 22L);
    }
}
