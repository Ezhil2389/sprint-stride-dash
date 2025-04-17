package com.example.projectmanagement.service;

import com.example.projectmanagement.model.dto.UserDto;
import com.example.projectmanagement.model.dto.request.UserRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface UserService {
    UserDto createUser(UserRequest request);
    UserDto updateUser(Long id, UserRequest request);
    void deleteUser(Long id);
    UserDto getUserById(Long id);
    Page<UserDto> getAllUsers(Pageable pageable);
    UserDto getCurrentUser();
} 