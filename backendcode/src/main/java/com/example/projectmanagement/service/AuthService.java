package com.example.projectmanagement.service;

import com.example.projectmanagement.model.dto.request.LoginRequest;
import com.example.projectmanagement.model.dto.response.JwtResponse;

public interface AuthService {
    JwtResponse login(LoginRequest request);
    void logout();
} 