-- migration 004 - stock_audit_and_users

-- TABELA USERS
-- =========================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca por email
CREATE INDEX idx_users_email ON users(email);



-- =========================
-- TABELA STOCK AUDIT
-- =========================

CREATE TABLE stock_audit (
    id SERIAL PRIMARY KEY,
    product_id INT NOT NULL,
    change_type VARCHAR(50) NOT NULL,
    quantity_changed INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    sale_id INT,

    CONSTRAINT fk_audit_product 
        FOREIGN KEY (product_id) REFERENCES products(id),

    CONSTRAINT fk_audit_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT fk_audit_sale 
        FOREIGN KEY (sale_id) REFERENCES sales(id)
);

-- =========================
-- ÍNDICES
-- =========================

CREATE INDEX idx_audit_product_id ON stock_audit(product_id);
CREATE INDEX idx_audit_user_id ON stock_audit(user_id);
CREATE INDEX idx_audit_sale_id ON stock_audit(sale_id);
