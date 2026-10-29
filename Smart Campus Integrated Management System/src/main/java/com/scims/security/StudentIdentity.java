package com.scims.security;

import com.scims.shared.ForbiddenException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public final class StudentIdentity {
    private StudentIdentity() {
    }

    public static Long requiredId(JwtAuthenticationToken authentication) {
        Long id = optionalId(authentication);
        if (id == null) {
            throw new ForbiddenException("The signed-in student account has no student_id claim.");
        }
        return id;
    }

    public static Long optionalId(JwtAuthenticationToken authentication) {
        if (authentication == null) {
            return null;
        }
        Object claim = authentication.getToken().getClaim("student_id");
        if (claim == null) {
            return null;
        }
        try {
            long id = Long.parseLong(claim.toString());
            if (id <= 0) {
                throw new NumberFormatException("Student ID must be positive.");
            }
            return id;
        } catch (NumberFormatException exception) {
            throw new ForbiddenException("The signed-in student account has an invalid student_id claim.");
        }
    }
}
