package com.example.projectmanagement.service;

import com.example.projectmanagement.model.dto.ProjectDto;
import com.example.projectmanagement.model.dto.request.ProjectRequest;
import com.example.projectmanagement.model.dto.request.ProjectStatusRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ProjectService {
    ProjectDto createProject(ProjectRequest request);
    ProjectDto updateProject(Long id, ProjectRequest request);
    void deleteProject(Long id);
    ProjectDto getProjectById(Long id);
    Page<ProjectDto> getAllProjects(Pageable pageable);
    ProjectDto updateProjectStatus(Long id, ProjectStatusRequest request);
    Page<ProjectDto> getUserProjects(Pageable pageable);
} 