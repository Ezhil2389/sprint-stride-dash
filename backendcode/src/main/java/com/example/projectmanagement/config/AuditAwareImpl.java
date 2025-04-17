package com.example.projectmanagement.config;

import com.example.projectmanagement.security.SecurityUtils;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("auditAwareImpl") // Give it an explicit bean name
public class AuditAwareImpl implements AuditorAware<String> {

    @Override
    public Optional<String> getCurrentAuditor() {
        // Try to get the username from the security context
        String username = SecurityUtils.getCurrentUsername();

        // If no user is logged in (e.g., during startup), return "SYSTEM"
        return Optional.ofNullable(username).or(() -> Optional.of("SYSTEM"));
    }
} 