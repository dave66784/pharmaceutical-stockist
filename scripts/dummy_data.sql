-- ============================================
-- QUICK START - Minimal Test Data
-- ============================================

-- USERS (Password: password123)
-- BCrypt hash for 'password123': $2b$12$CY3kCQucaRojOdu8jLJlVOoiHRT4H/HwD/bLDMjyrOZi5LdlqCXty
INSERT INTO users (email, password, first_name, last_name, phone, role, created_at, updated_at) VALUES
('admin@test.com', '$2b$12$CY3kCQucaRojOdu8jLJlVOoiHRT4H/HwD/bLDMjyrOZi5LdlqCXty', 'Admin', 'User', '1111111111', 'ADMIN', NOW(), NOW()),
('user@test.com', '$2b$12$CY3kCQucaRojOdu8jLJlVOoiHRT4H/HwD/bLDMjyrOZi5LdlqCXty', 'Test', 'User', '2222222222', 'CUSTOMER', NOW(), NOW())
ON CONFLICT (email) DO UPDATE 
SET password = EXCLUDED.password;

-- PRODUCTS
INSERT INTO products (name, description, manufacturer, price, stock_quantity, category, is_prescription_required, is_deleted, created_at, updated_at) VALUES
('Paracetamol 500mg', 'Pain relief tablets', 'PharmaCo', 5.99, 100, 'PAIN_RELIEF', false, false, NOW(), NOW()),
('Ibuprofen 400mg', 'Anti-inflammatory', 'HealthMeds', 7.99, 75, 'PAIN_RELIEF', false, false, NOW(), NOW()),
('Vitamin C 1000mg', 'Immune support', 'VitaLife', 11.99, 200, 'VITAMINS', false, false, NOW(), NOW()),
('Multivitamin Daily', 'Complete daily vitamin', 'VitaLife', 14.99, 150, 'VITAMINS', false, false, NOW(), NOW()),
('Cold & Flu Relief', 'Multi-symptom relief', 'ColdCare', 9.99, 80, 'COLD_FLU', false, false, NOW(), NOW()),
('Cough Syrup', 'Soothing cough relief', 'ThroatEase', 7.50, 60, 'COLD_FLU', false, false, NOW(), NOW()),
('Antacid Tablets', 'Heartburn relief', 'DigestWell', 5.99, 120, 'DIGESTIVE', false, false, NOW(), NOW()),
('Bandages Pack', 'Sterile adhesive bandages', 'FirstAid Plus', 5.99, 300, 'FIRST_AID', false, false, NOW(), NOW()),
('Antiseptic Spray', 'Wound cleaning spray', 'WoundCare', 6.99, 90, 'FIRST_AID', false, false, NOW(), NOW()),
('Amoxicillin 500mg', 'Antibiotic (Prescription)', 'AntiBioTech', 15.99, 50, 'ANTIBIOTICS', true, false, NOW(), NOW());
