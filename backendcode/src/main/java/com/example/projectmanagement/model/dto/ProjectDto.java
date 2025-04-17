package com.example.projectmanagement.model.dto;

import com.example.projectmanagement.model.enums.PriorityLevel;
import com.example.projectmanagement.model.enums.ProjectStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDto {
    private Long id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long assignedToId;
    private String assignedToName;
    private PriorityLevel priority;
    private ProjectStatus status;
} 