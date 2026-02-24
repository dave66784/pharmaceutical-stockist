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
ALTER TABLE products ADD COLUMN IF NOT EXISTS sub_category VARCHAR(255);

INSERT INTO products (name, description, manufacturer, price, stock_quantity, category, sub_category, is_prescription_required, is_bundle_offer, is_deleted, created_at, updated_at) VALUES
('Paracetamol 500mg', 'Pain relief tablets', 'PharmaCo', 5.99, 100, 'PAIN_RELIEF',  NULL, false, false, false, NOW(), NOW()),
('Ibuprofen 400mg', 'Anti-inflammatory', 'HealthMeds', 7.99, 75, 'PAIN_RELIEF',  NULL, false, false, false, NOW(), NOW()),
('Vitamin C 1000mg', 'Immune support', 'VitaLife', 11.99, 200, 'VITAMINS',  NULL, false, false, false, NOW(), NOW()),
('Multivitamin Daily', 'Complete daily vitamin', 'VitaLife', 14.99, 150, 'VITAMINS',  NULL, false, false, false, NOW(), NOW()),
('Cold & Flu Relief', 'Multi-symptom relief', 'ColdCare', 9.99, 80, 'COLD_FLU',  NULL, false, false, false, NOW(), NOW()),
('Cough Syrup', 'Soothing cough relief', 'ThroatEase', 7.50, 60, 'COLD_FLU',  NULL, false, false, false, NOW(), NOW()),
('Antacid Tablets', 'Heartburn relief', 'DigestWell', 5.99, 120, 'DIGESTIVE',  NULL, false, false, false, NOW(), NOW()),
('Bandages Pack', 'Sterile adhesive bandages', 'FirstAid Plus', 5.99, 300, 'FIRST_AID',  NULL, false, false, false, NOW(), NOW()),
('Antiseptic Spray', 'Wound cleaning spray', 'WoundCare', 6.99, 90, 'FIRST_AID',  NULL, false, false, false, NOW(), NOW()),
('Amoxicillin 500mg', 'Antibiotic (Prescription)', 'AntiBioTech', 15.99, 50, 'ANTIBIOTICS', true, false, NOW(), NOW());

-- Update existing products with sub-categories
UPDATE products SET sub_category = 'General' WHERE name = 'Paracetamol 500mg' AND category = 'PAIN_RELIEF';
UPDATE products SET sub_category = 'General' WHERE name = 'Ibuprofen 400mg' AND category = 'PAIN_RELIEF';
UPDATE products SET sub_category = 'General' WHERE name = 'Vitamin C 1000mg' AND category = 'VITAMINS';
UPDATE products SET sub_category = 'General' WHERE name = 'Multivitamin Daily' AND category = 'VITAMINS';
UPDATE products SET sub_category = 'General' WHERE name = 'Cold & Flu Relief' AND category = 'COLD_FLU';
UPDATE products SET sub_category = 'General' WHERE name = 'Cough Syrup' AND category = 'COLD_FLU';
UPDATE products SET sub_category = 'General' WHERE name = 'Antacid Tablets' AND category = 'DIGESTIVE';
UPDATE products SET sub_category = 'General' WHERE name = 'Bandages Pack' AND category = 'FIRST_AID';
UPDATE products SET sub_category = 'General' WHERE name = 'Antiseptic Spray' AND category = 'FIRST_AID';
UPDATE products SET sub_category = 'General' WHERE name = 'Amoxicillin 500mg' AND category = 'ANTIBIOTICS';

-- NEW VACCINES (from enhancement.txt)
INSERT INTO products (name, description, manufacturer, price, stock_quantity, category, sub_category, is_prescription_required, is_bundle_offer, is_deleted, created_at, updated_at) VALUES
-- BCG
('Tubervac', 'BCG Vaccine', 'Serum Institute', 15.00, 100, 'VACCINES', 'BCG', true, false, false, NOW(), NOW()),
-- OPV
('BioPolio', 'Oral Polio Vaccine', 'Bharat Biotech', 10.00, 500, 'VACCINES', 'OPV', true, false, false, NOW(), NOW()),
-- MMR
('Tresivac', 'MMR Vaccine', 'Serum Institute', 25.00, 200, 'VACCINES', 'MMR', true, false, false, NOW(), NOW()),
('Priorix', 'MMR Vaccine', 'GSK', 45.00, 150, 'VACCINES', 'MMR', true, false, false, NOW(), NOW()),
('Zayvac MMR', 'MMR Vaccine', 'Zydus', 22.00, 100, 'VACCINES', 'MMR', true, false, false, NOW(), NOW()),
-- Rotavirus
('Rotavac 5D', 'Rotavirus Vaccine', 'Bharat Biotech', 35.00, 300, 'VACCINES', 'Rotavirus', true, false, false, NOW(), NOW()),
('Rotasil', 'Rotavirus Vaccine', 'Serum Institute', 30.00, 250, 'VACCINES', 'Rotavirus', true, false, false, NOW(), NOW()),
('Rotarix', 'Rotavirus Vaccine', 'GSK', 65.00, 150, 'VACCINES', 'Rotavirus', true, false, false, NOW(), NOW()),
('Rotateq', 'Rotavirus Vaccine', 'MSD', 70.00, 100, 'VACCINES', 'Rotavirus', true, false, false, NOW(), NOW()),
-- Pneumococcal
('Prevenar 13', 'Pneumococcal Vaccine', 'Pfizer', 120.00, 100, 'VACCINES', 'Pneumococcal', true, false, false, NOW(), NOW()),
('Synflorix', 'Pneumococcal Vaccine', 'GSK', 95.00, 120, 'VACCINES', 'Pneumococcal', true, false, false, NOW(), NOW()),
('Pneumosil', 'Pneumococcal Vaccine', 'Serum Institute', 80.00, 200, 'VACCINES', 'Pneumococcal', true, false, false, NOW(), NOW()),
('PneuBEvax 14', 'Pneumococcal Vaccine', 'BE', 75.00, 150, 'VACCINES', 'Pneumococcal', true, false, false, NOW(), NOW()),
('Pneumoshield', 'Pneumococcal Vaccine', 'Abbott', 85.00, 100, 'VACCINES', 'Pneumococcal', true, false, false, NOW(), NOW()),
('Prevenar 20', 'Pneumococcal Vaccine', 'Pfizer', 150.00, 50, 'VACCINES', 'Pneumococcal', true, false, false, NOW(), NOW()),
-- Hexa-Valant
('Hexaxim', 'Hexavalent Vaccine', 'Dr Reddy', 180.00, 50, 'VACCINES', 'Hexa-Valant', true, false, false, NOW(), NOW()),
('Infanrix Hexa', 'Hexavalent Vaccine', 'GSK', 210.00, 40, 'VACCINES', 'Hexa-Valant', true, false, false, NOW(), NOW()),
('EasySix', 'Hexavalent Vaccine', 'Panacea Biotech', 160.00, 60, 'VACCINES', 'Hexa-Valant', true, false, false, NOW(), NOW()),
('Hexasil', 'Hexavalent Vaccine', 'Serum Institute', 150.00, 80, 'VACCINES', 'Hexa-Valant', true, false, false, NOW(), NOW()),
-- Chickenpox
('Varilrix', 'Chickenpox Vaccine', 'GSK', 55.00, 100, 'VACCINES', 'Chickenpox', true, false, false, NOW(), NOW()),
('Varivax', 'Chickenpox Vaccine', 'MSD', 60.00, 90, 'VACCINES', 'Chickenpox', true, false, false, NOW(), NOW()),
('Variped', 'Chickenpox Vaccine', 'MSD', 60.00, 50, 'VACCINES', 'Chickenpox', true, false, false, NOW(), NOW()),
('Naxipox', 'Chickenpox Vaccine', 'Novo', 50.00, 70, 'VACCINES', 'Chickenpox', true, false, false, NOW(), NOW()),
-- Typhoid
('Typbar TCV', 'Typhoid Vaccine', 'Bharat Biotech', 40.00, 200, 'VACCINES', 'Typhoid', true, false, false, NOW(), NOW()),
('Zayvac TCV', 'Typhoid Vaccine', 'Zydus', 35.00, 150, 'VACCINES', 'Typhoid', true, false, false, NOW(), NOW()),
('Biovac TCV', 'Typhoid Vaccine', 'Dr Reddy', 38.00, 120, 'VACCINES', 'Typhoid', true, false, false, NOW(), NOW()),
('EntroShield', 'Typhoid Vaccine', 'Abbott', 42.00, 100, 'VACCINES', 'Typhoid', true, false, false, NOW(), NOW()),
-- Hepatitis A
('Havrix 720', 'Hepatitis A Vaccine', 'GSK', 50.00, 100, 'VACCINES', 'Hepatitis A', true, false, false, NOW(), NOW()),
('HavShield', 'Hepatitis A Vaccine', 'Abbott', 45.00, 120, 'VACCINES', 'Hepatitis A', true, false, false, NOW(), NOW()),
('Hapibev', 'Hepatitis A Vaccine', 'BE', 40.00, 150, 'VACCINES', 'Hepatitis A', true, false, false, NOW(), NOW()),
-- Japanese Encephalitis
('JenVac', 'JE Vaccine', 'Bharat Biotech', 30.00, 100, 'VACCINES', 'Japanese Encephalitis', true, false, false, NOW(), NOW()),
('Jeev', 'JE Vaccine', 'BE', 28.00, 120, 'VACCINES', 'Japanese Encephalitis', true, false, false, NOW(), NOW()),
('JE Shield', 'JE Vaccine', 'Abbott', 32.00, 100, 'VACCINES', 'Japanese Encephalitis', true, false, false, NOW(), NOW()),
-- Meningitis
('Menactra', 'Meningitis Vaccine', 'Dr Reddy', 90.00, 50, 'VACCINES', 'Meningitis', true, false, false, NOW(), NOW()),
('Menveo', 'Meningitis Vaccine', 'GSK', 95.00, 60, 'VACCINES', 'Meningitis', true, false, false, NOW(), NOW()),
-- Flu
('Influvac Tetra', 'Flu Vaccine', 'Abbott', 35.00, 300, 'VACCINES', 'Flu', true, false, false, NOW(), NOW()),
('Fluarix Tetra', 'Flu Vaccine', 'GSK', 38.00, 250, 'VACCINES', 'Flu', true, false, false, NOW(), NOW()),
('Vaxigrip', 'Flu Vaccine', 'Dr Reddy', 32.00, 200, 'VACCINES', 'Flu', true, false, false, NOW(), NOW()),
('VaxiFlu', 'Flu Vaccine', 'Zydus', 30.00, 150, 'VACCINES', 'Flu', true, false, false, NOW(), NOW()),
('VaxiFlu 4', 'Flu Vaccine', 'Zydus', 35.00, 100, 'VACCINES', 'Flu', true, false, false, NOW(), NOW()),
-- HPV
('Cervavac', 'HPV Vaccine', 'Serum Institute', 120.00, 50, 'VACCINES', 'HPV', true, false, false, NOW(), NOW()),
('Gardasil', 'HPV Vaccine', 'MSD', 150.00, 60, 'VACCINES', 'HPV', true, false, false, NOW(), NOW()),
('Gardasil 9', 'HPV Vaccine', 'MSD', 220.00, 40, 'VACCINES', 'HPV', true, false, false, NOW(), NOW()),
-- Pneumococcal 23 Valent
('Pneumovax 23', 'Pneumomultivalent Vaccine', 'MSD', 80.00, 100, 'VACCINES', 'Pneumococcal 23 Valent', true, false, false, NOW(), NOW()),
('VaxiMune 23', 'Pneumomultivalent Vaccine', 'GC Chemie', 75.00, 80, 'VACCINES', 'Pneumococcal 23 Valent', true, false, false, NOW(), NOW()),
-- Tdap
('Boostrix', 'Tdap Vaccine', 'GSK', 40.00, 200, 'VACCINES', 'Tdap', true, false, false, NOW(), NOW()),

-- PAIN RELIEF (Paracetamol brands)
('Dolo 650', 'Paracetamol 650mg', 'Micro Labs', 2.50, 500, 'PAIN_RELIEF', 'Paracetamol', false, false, false, NOW(), NOW()),
('Calpol 500', 'Paracetamol 500mg', 'GSK', 1.80, 600, 'PAIN_RELIEF', 'Paracetamol', false, false, false, NOW(), NOW()),
('Crocin Advance', 'Fast relief paracetamol', 'GSK', 2.20, 450, 'PAIN_RELIEF', 'Paracetamol', false, false, false, NOW(), NOW()),
('T-98', 'Paracetamol liquid/drops', 'Mankind', 1.50, 300, 'PAIN_RELIEF', 'Paracetamol', false, false, false, NOW(), NOW()),
('Brufen 400', 'Ibuprofen 400mg', 'Abbott', 3.50, 400, 'PAIN_RELIEF', 'Ibuprofen', false, false, false, NOW(), NOW()),
('Ibugesic', 'Ibuprofen oral suspension', 'Cipla', 2.80, 250, 'PAIN_RELIEF', 'Ibuprofen', false, false, false, NOW(), NOW());
