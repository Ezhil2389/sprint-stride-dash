package com.example.projectmanagement.repository;

import com.example.projectmanagement.model.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByAssignedToId(Long userId);
    Page<Project> findByAssignedToId(Long userId, Pageable pageable);
} 