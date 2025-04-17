package com.example.projectmanagement.controller;

import com.example.projectmanagement.model.dto.ProjectDto;
import com.example.projectmanagement.model.dto.request.ProjectRequest;
import com.example.projectmanagement.model.dto.request.ProjectStatusRequest;
import com.example.projectmanagement.model.dto.response.ApiResponse;
import com.example.projectmanagement.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> createProject(@Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success(projectService.createProject(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success(projectService.updateProject(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.success("Project deleted successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProjectDto>> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getProjectById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProjectDto>>> getAllProjects(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getAllProjects(pageable)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<ProjectDto>> updateProjectStatus(
            @PathVariable Long id,
            @Valid @RequestBody ProjectStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(projectService.updateProjectStatus(id, request)));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<Page<ProjectDto>>> getUserProjects(Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(projectService.getUserProjects(pageable)));
    }
} 