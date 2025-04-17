package com.example.projectmanagement.service.mapper;

import com.example.projectmanagement.model.dto.ProjectDto;
import com.example.projectmanagement.model.dto.request.ProjectRequest;
import com.example.projectmanagement.model.entity.Project;
import com.example.projectmanagement.model.entity.User;
import org.springframework.stereotype.Component;

@Component
public class ProjectMapper {
    
    public ProjectDto toDto(Project project) {
        return ProjectDto.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .assignedToId(project.getAssignedTo() != null ? project.getAssignedTo().getId() : null)
                .assignedToName(project.getAssignedTo() != null ? 
                    project.getAssignedTo().getFirstName() + " " + project.getAssignedTo().getLastName() : null)
                .priority(project.getPriority())
                .status(project.getStatus())
                .build();
    }

    public Project toEntity(ProjectRequest request) {
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setPriority(request.getPriority());
        
        if (request.getAssignedToId() != null) {
            User assignedTo = new User();
            assignedTo.setId(request.getAssignedToId());
            project.setAssignedTo(assignedTo);
        }
        
        return project;
    }

    public void updateEntity(Project project, ProjectRequest request) {
        if (request.getName() != null) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            project.setEndDate(request.getEndDate());
        }
        if (request.getPriority() != null) {
            project.setPriority(request.getPriority());
        }
        if (request.getAssignedToId() != null) {
            User assignedTo = new User();
            assignedTo.setId(request.getAssignedToId());
            project.setAssignedTo(assignedTo);
        }
    }
} 