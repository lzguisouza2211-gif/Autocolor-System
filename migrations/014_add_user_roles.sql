-- migration 014: add role column to users table for admin control and indexing

ALTER TABLE users
ADD COLUMN role VARCHAR(50) DEFAULT 'operator';

-- Add index for role queries
CREATE INDEX idx_users_role ON users(role);

-- Example: to make a user admin, update manually in Supabase:
-- UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';


--convert users.id to UUID and auto-create from auth.users

-- Step 1: Drop existing constraints and references
ALTER TABLE stock_audit DROP CONSTRAINT IF EXISTS stock_audit_user_id_fkey;

-- Step 2: Change stock_audit.user_id to UUID (if it still references users)
ALTER TABLE stock_audit ALTER COLUMN user_id TYPE UUID USING user_id::TEXT::UUID;

-- Step 3: Drop and recreate users table with UUID
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'operator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for role queries
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read all users" ON users;
DROP POLICY IF EXISTS "Allow users to insert their own record" ON users;
DROP POLICY IF EXISTS "Allow users to update their own record" ON users;

-- Create RLS policies
CREATE POLICY "Allow authenticated users to read all users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow users to insert their own record"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow users to update their own record"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 4: Create function to auto-create user on login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        'operator'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Recreate foreign key for stock_audit
ALTER TABLE stock_audit 
    ADD CONSTRAINT stock_audit_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- USAGE:
-- 1. Create user in Supabase Auth Dashboard (Authentication > Users > Add User)
-- 2. User will automatically be created in users table with role='operator'
-- 3. To make admin, run: UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';


--fix sales.user_id relationship to point to users table (not auth.users)

-- Drop the old constraint pointing to auth.users
ALTER TABLE sales DROP CONSTRAINT IF EXISTS fk_sales_user_auth;

-- Create new constraint pointing to public.users
ALTER TABLE sales 
ADD CONSTRAINT fk_sales_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Keep the index for performance
-- CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id); -- already exists from migration 012
