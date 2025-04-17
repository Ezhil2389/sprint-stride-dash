package com.example.projectmanagement.model.dto.request;

import com.example.projectmanagement.model.enums.ProjectStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectStatusRequest {
    @NotNull(message = "Status is required")
    private ProjectStatus status;
} 