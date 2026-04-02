package com.pharma.controller;

import com.pharma.dto.response.ApiResponse;
import com.pharma.model.User;
import com.pharma.model.enums.AuditAction;
import com.pharma.model.enums.Role;
import com.pharma.service.AuditService;
import com.pharma.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final AuditService auditService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<User>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Users retrieved successfully", users));
    }

    @GetMapping("/role/{role}")
    public ResponseEntity<ApiResponse<Page<User>>> getUsersByRole(
            @PathVariable Role role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> users = userService.getUsersByRole(role, pageable);
        return ResponseEntity.ok(new ApiResponse<>(true, "Users retrieved successfully", users));
    }

    @PutMapping("/{userId}/role")
    public ResponseEntity<ApiResponse<User>> updateUserRole(
            @PathVariable Long userId,
            @RequestParam Role role,
            org.springframework.security.core.Authentication auth,
            HttpServletRequest request) {
        User user = userService.updateUserRole(userId, role);
        auditService.log(AuditAction.USER_ROLE_CHANGED, "USER", String.valueOf(userId),
                user.getEmail() + " role set to " + role, auth, request);
        return ResponseEntity.ok(new ApiResponse<>(true, "User role updated successfully", user));
    }
}
