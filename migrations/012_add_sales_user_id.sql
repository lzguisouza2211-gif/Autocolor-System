-- migration 010: add user_id to sales (auth user)

ALTER TABLE sales
ADD COLUMN user_id UUID;

-- optional: link to auth.users
ALTER TABLE sales
ADD CONSTRAINT fk_sales_user_auth
FOREIGN KEY (user_id) REFERENCES auth.users(id);

CREATE INDEX idx_sales_user_id ON sales(user_id);
