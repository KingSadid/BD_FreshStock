-- ======================================================
-- FRESHSTOCK DATABASE SCHEMA
-- Author: Sadid Acosta
-- ======================================================

DROP DATABASE IF EXISTS freshstock;
CREATE DATABASE freshstock;
USE freshstock;

CREATE TABLE user (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'warehouse', 'seller') NOT NULL DEFAULT 'seller',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) COMMENT 'System users with roles';

CREATE TABLE branch (
    branch_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) COMMENT 'Branches or warehouses';

CREATE TABLE supplier (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
) COMMENT 'Product suppliers';

CREATE TABLE category (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id INT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (parent_category_id) REFERENCES category(category_id) ON DELETE RESTRICT
) COMMENT 'Product categories (self-referential for hierarchy)';

CREATE TABLE unit_of_measure (
    unit_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10),
    type VARCHAR(20) COMMENT 'weight, volume, unit, length'
) COMMENT 'Units of measure';

CREATE TABLE product (
    sku VARCHAR(50) PRIMARY KEY,
    barcode VARCHAR(50) UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_id INT,
    unit_id INT,
    min_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
    sale_price DECIMAL(12,2) NOT NULL,
    requires_refrigeration BOOLEAN NOT NULL DEFAULT FALSE,
    expiry_alert_days SMALLINT DEFAULT 7,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES category(category_id) ON DELETE SET NULL,
    FOREIGN KEY (unit_id) REFERENCES unit_of_measure(unit_id) ON DELETE SET NULL
) COMMENT 'Product master catalog';

CREATE TABLE batch (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_code VARCHAR(50) NOT NULL UNIQUE,
    product_sku VARCHAR(50) NOT NULL,
    supplier_id INT,
    branch_id INT NOT NULL,
    entry_date DATE NOT NULL,
    production_date DATE,
    expiry_date DATE NOT NULL,
    initial_quantity DECIMAL(10,2) NOT NULL,
    current_quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(12,2) NOT NULL,
    warehouse_location VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, depleted, expired, blocked',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_sku) REFERENCES product(sku) ON DELETE RESTRICT,
    FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE RESTRICT,
    INDEX idx_expiry_date (expiry_date),
    INDEX idx_product_sku (product_sku),
    INDEX idx_status (status)
) COMMENT 'Product batches with expiry dates (FIFO core)';

CREATE TABLE movement_type (
    movement_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    sign ENUM('+', '-') NOT NULL COMMENT '+ for entry, - for exit',
    description TEXT
) COMMENT 'Movement types (purchase, sale, adjustment, waste)';

CREATE TABLE movement (
    movement_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    movement_type_id INT NOT NULL,
    user_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    previous_quantity DECIMAL(10,2) NOT NULL,
    posterior_quantity DECIMAL(10,2) NOT NULL,
    reason TEXT,
    reference_document VARCHAR(50),
    datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_origin VARCHAR(45),
    FOREIGN KEY (batch_id) REFERENCES batch(batch_id) ON DELETE RESTRICT,
    FOREIGN KEY (movement_type_id) REFERENCES movement_type(movement_type_id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE RESTRICT,
    INDEX idx_batch_id (batch_id),
    INDEX idx_datetime (datetime),
    INDEX idx_user_id (user_id)
) COMMENT 'Immutable inventory movements (audit log)';

CREATE TABLE alert_type (
    alert_type_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    priority SMALLINT NOT NULL DEFAULT 1 COMMENT '1=low, 5=critical',
    description TEXT
) COMMENT 'Alert categories';

CREATE TABLE alert (
    alert_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    alert_type_id INT NOT NULL,
    batch_id INT,
    user_id INT NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    additional_data JSON,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (alert_type_id) REFERENCES alert_type(alert_type_id) ON DELETE RESTRICT,
    FOREIGN KEY (batch_id) REFERENCES batch(batch_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) COMMENT 'System alerts for expiry, low stock, etc.';

CREATE TABLE audit_session (
    session_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    start_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES user(user_id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_active (is_active)
) COMMENT 'User session audit';

CREATE TABLE product_supplier (
    product_sku VARCHAR(50) NOT NULL,
    supplier_id INT NOT NULL,
    supplier_code VARCHAR(50),
    purchase_price DECIMAL(12,2) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_sku, supplier_id),
    FOREIGN KEY (product_sku) REFERENCES product(sku) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES supplier(supplier_id) ON DELETE CASCADE,
    INDEX idx_supplier_id (supplier_id)
) COMMENT 'Many-to-many product-supplier with purchase info';

INSERT INTO movement_type (name, sign, description) VALUES
('purchase', '+', 'Initial stock purchase or restock'),
('sale', '-', 'Sale to customer'),
('adjustment', '+', 'Inventory adjustment (positive)'),
('adjustment_neg', '-', 'Inventory adjustment (negative)'),
('waste', '-', 'Product waste due to expiry or damage');

INSERT INTO alert_type (name, priority, description) VALUES
('expiry_warning', 3, 'Product approaching expiry date'),
('expired', 5, 'Product has expired'),
('low_stock', 4, 'Stock below minimum threshold'),
('batch_depleted', 2, 'Batch has been fully consumed');

INSERT INTO unit_of_measure (name, abbreviation, type) VALUES
('kilogram', 'kg', 'weight'),
('gram', 'g', 'weight'),
('liter', 'L', 'volume'),
('milliliter', 'mL', 'volume'),
('unit', 'un', 'unit'),
('dozen', 'dz', 'unit');


INSERT INTO category (name, description, parent_category_id, is_active) VALUES
('Dairy', 'Milk, cheese, yogurt', NULL, TRUE),
('Vegetables', 'Fresh vegetables', NULL, TRUE),
('Fruits', 'Fresh fruits', NULL, TRUE);

INSERT INTO product (sku, barcode, name, description, category_id, unit_id, min_stock, sale_price, requires_refrigeration, expiry_alert_days) VALUES
('MILK001', '750123456789', 'Fresh Whole Milk', 'Pasteurized whole milk 1L', 1, 3, 10, 2.50, TRUE, 3);

INSERT INTO branch (name, address, is_active) VALUES
('Main Store', '123 Main St, City', TRUE);

INSERT INTO supplier (name, contact_person, phone, email, is_active) VALUES
('Dairy Farms Co.', 'John Doe', '555-1234', 'contact@dairyfarms.com', TRUE);