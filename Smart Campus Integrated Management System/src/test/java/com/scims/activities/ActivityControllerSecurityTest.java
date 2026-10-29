package com.scims.activities;

import com.scims.security.SecurityConfig;
import com.scims.shared.ApiExceptionHandler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(value = ActivityController.class,
        properties = "scims.security.jwt.secret=0123456789abcdef0123456789abcdef")
@Import({SecurityConfig.class, ApiExceptionHandler.class})
class ActivityControllerSecurityTest {
    @Autowired
    private MockMvc mockMvc;
    @MockitoBean
    private ActivityService activityService;

    @Test
    void adminCanCreateActivity() throws Exception {
        ActivityResponse response = new ActivityResponse(1L, "Workshop", "Technical", "CS Lab",
                LocalDateTime.of(2026, 11, 15, 10, 0), "Details", 25, null, null);
        when(activityService.create(any(ActivityRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/activities")
                        .with(jwt().authorities(() -> "ROLE_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validActivityJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.capacity").value(25));
    }

    @Test
    void studentCannotCreateActivity() throws Exception {
        mockMvc.perform(post("/api/activities")
                        .with(jwt().authorities(() -> "ROLE_STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validActivityJson()))
                .andExpect(status().isForbidden());

        verify(activityService, never()).create(any(ActivityRequest.class));
    }

    @Test
    void rejectsInvalidCapacityBeforeCallingService() throws Exception {
        String invalidCapacity = validActivityJson().replace("\"capacity\":25", "\"capacity\":0");

        mockMvc.perform(post("/api/activities")
                        .with(jwt().authorities(() -> "ROLE_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidCapacity))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.capacity").exists());

        verify(activityService, never()).create(any(ActivityRequest.class));
    }

    private String validActivityJson() {
        return """
                {
                  "title":"Workshop",
                  "category":"Technical",
                  "description":"Details",
                  "eventDate":"2026-11-15T10:00:00",
                  "venue":"CS Lab",
                  "capacity":25
                }
                """;
    }
}
