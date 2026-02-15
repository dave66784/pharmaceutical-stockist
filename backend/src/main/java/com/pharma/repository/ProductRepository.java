package com.pharma.repository;

import com.pharma.model.Product;
import com.pharma.model.enums.ProductCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByCategoryAndIsDeletedFalse(ProductCategory category, Pageable pageable);

    Page<Product> findByIsDeletedFalse(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.isDeleted = false AND (LOWER(p.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) "
            +
            "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
            "OR LOWER(p.manufacturer) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    Page<Product> searchProducts(@Param("searchTerm") String searchTerm, Pageable pageable);

    List<Product> findByStockQuantityLessThanAndIsDeletedFalse(Integer threshold);

    // Dashboard statistics queries
    Long countByStockQuantityBetween(Integer min, Integer max);

    Long countByStockQuantity(Integer quantity);

    // Low stock products
    Page<Product> findByStockQuantityLessThanAndIsDeletedFalse(Integer threshold, Pageable pageable);
}
