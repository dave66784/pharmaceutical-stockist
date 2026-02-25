package com.pharma.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.pharma.model.Category;
import com.pharma.model.SubCategory;

@Repository
public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {
    List<SubCategory> findByCategory(Category category);
    Optional<SubCategory> findBySlugAndCategory(String slug, Category category);
    Optional<SubCategory> findByNameIgnoreCaseAndCategory(String name, Category category);
}
