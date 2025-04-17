package com.example.projectmanagement.model.entity;

import com.example.projectmanagement.model.entity.audit.Auditable;
import com.example.projectmanagement.model.enums.RoleType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
public class User extends Auditable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(name = "first_name", length = 50)
    private String firstName;

    @Column(name = "last_name", length = 50)
    private String lastName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleType role;

    @Column(nullable = false)
    private boolean enabled = true;

    @OneToMany(mappedBy = "assignedTo", cascade = CascadeType.ALL)
    private List<Project> assignedProjects = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        if (this.role == null) {
            this.role = RoleType.EMPLOYEE;
        }
    }
} 