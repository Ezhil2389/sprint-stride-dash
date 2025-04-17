package com.example.projectmanagement.service.impl;

import com.example.projectmanagement.exception.ResourceNotFoundException;
import com.example.projectmanagement.exception.UnauthorizedAccessException;
import com.example.projectmanagement.model.dto.ProjectDto;
import com.example.projectmanagement.model.dto.request.ProjectRequest;
import com.example.projectmanagement.model.dto.request.ProjectStatusRequest;
import com.example.projectmanagement.model.entity.Project;
import com.example.projectmanagement.model.entity.User;
import com.example.projectmanagement.repository.ProjectRepository;
import com.example.projectmanagement.repository.UserRepository;
import com.example.projectmanagement.security.SecurityUtils;
import com.example.projectmanagement.service.ProjectService;
import com.example.projectmanagement.service.mapper.ProjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMapper projectMapper;

    @Override
    @Transactional
    public ProjectDto createProject(ProjectRequest request) {
        if (!SecurityUtils.isManager()) {
            throw new UnauthorizedAccessException("Only managers can create projects");
        }

        Project project = projectMapper.toEntity(request);
        
        if (request.getAssignedToId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            project.setAssignedTo(assignedUser);
        }

        return projectMapper.toDto(projectRepository.save(project));
    }

    @Override
    @Transactional
    public ProjectDto updateProject(Long id, ProjectRequest request) {
        if (!SecurityUtils.isManager()) {
            throw new UnauthorizedAccessException("Only managers can update projects");
        }

        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));

        projectMapper.updateEntity(project, request);

        if (request.getAssignedToId() != null) {
            User assignedUser = userRepository.findById(request.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getAssignedToId()));
            project.setAssignedTo(assignedUser);
        }

        return projectMapper.toDto(projectRepository.save(project));
    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        if (!SecurityUtils.isManager()) {
            throw new UnauthorizedAccessException("Only managers can delete projects");
        }

        if (!projectRepository.existsById(id)) {
            throw new ResourceNotFoundException("Project", "id", id);
        }
        projectRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDto getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));

        if (!SecurityUtils.isManager() && !isUserAssignedToProject(project)) {
            throw new UnauthorizedAccessException("You can only view your assigned projects");
        }

        return projectMapper.toDto(project);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProjectDto> getAllProjects(Pageable pageable) {
        if (SecurityUtils.isManager()) {
            return projectRepository.findAll(pageable).map(projectMapper::toDto);
        }
        return getUserProjects(pageable);
    }

    @Override
    @Transactional
    public ProjectDto updateProjectStatus(Long id, ProjectStatusRequest request) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", id));

        if (!SecurityUtils.isManager() && !isUserAssignedToProject(project)) {
            throw new UnauthorizedAccessException("You can only update status of your assigned projects");
        }

        project.setStatus(request.getStatus());
        return projectMapper.toDto(projectRepository.save(project));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProjectDto> getUserProjects(Pageable pageable) {
        String username = SecurityUtils.getCurrentUsername();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Project> projects = projectRepository.findByAssignedToId(user.getId());
        List<ProjectDto> projectDtos = projects.stream()
                .map(projectMapper::toDto)
                .collect(Collectors.toList());
        
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), projectDtos.size());
        
        return new PageImpl<>(
                projectDtos.subList(start, end), 
                pageable, 
                projectDtos.size()
        );
    }

    private boolean isUserAssignedToProject(Project project) {
        String username = SecurityUtils.getCurrentUsername();
        return project.getAssignedTo() != null && 
               project.getAssignedTo().getUsername().equals(username);
    }
} 