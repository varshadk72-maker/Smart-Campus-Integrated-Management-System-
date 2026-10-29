package com.scims.shared;

import java.util.Map;

public record ApiError(String message, Map<String, String> errors) {
}
