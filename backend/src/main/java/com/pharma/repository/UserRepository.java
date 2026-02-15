package com.pharma.repository;

import com.pharma.model.User;
import com.pharma.model.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    Boolean existsByEmail(String email);

    // Dashboard statistics queries
    Long countByRole(Role role);

    Long countByRoleAndCreatedAtAfter(Role role, LocalDateTime date);

    // Admin user management
    Page<User> findAll(Pageable pageable);

    Page<User> findByRole(Role role, Pageable pageable);
}
