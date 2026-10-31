package com.scims.activities;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record ActivityRequest(
        @NotBlank @Size(max = 100) String title,
        @NotBlank @Size(max = 50) String category,
        @Size(max = 5000) String description,
        @NotNull LocalDateTime eventDate,
        @NotBlank @Size(max = 150) String venue,
        @NotNull @Min(1) Integer capacity) {
}
