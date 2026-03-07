-- ==========================================
-- 1. Database Schema (Tables & Views)
-- ==========================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table: store_sales
CREATE TABLE IF NOT EXISTS store_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    product_name text NOT NULL,
    category text NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    price numeric NOT NULL CHECK (price >= 0),
    city text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Table: online_sales
CREATE TABLE IF NOT EXISTS online_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    date date NOT NULL,
    product_name text NOT NULL,
    category text NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    price numeric NOT NULL CHECK (price >= 0),
    location text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- View: combined_sales
CREATE OR REPLACE VIEW combined_sales AS
SELECT
    date,
    product_name,
    category,
    quantity,
    price,
    city AS location,
    'store' AS source
FROM store_sales
UNION ALL
SELECT
    date,
    product_name,
    category,
    quantity,
    price,
    location,
    'online' AS source
FROM online_sales;

-- ==========================================
-- 2. Performance Indexes
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_store_sales_date ON store_sales(date);
CREATE INDEX IF NOT EXISTS idx_store_sales_category ON store_sales(category);
CREATE INDEX IF NOT EXISTS idx_store_sales_product ON store_sales(product_name);

CREATE INDEX IF NOT EXISTS idx_online_sales_date ON online_sales(date);
CREATE INDEX IF NOT EXISTS idx_online_sales_category ON online_sales(category);
CREATE INDEX IF NOT EXISTS idx_online_sales_product ON online_sales(product_name);

-- ==========================================
-- 3. Row Level Security & Realtime
-- ==========================================

ALTER TABLE store_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE online_sales ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read data
CREATE POLICY "Allow authenticated users to read store sales" 
ON store_sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read online sales" 
ON online_sales FOR SELECT TO authenticated USING (true);


-- ==========================================
-- 4. Business Logic (RPC Functions)
-- ==========================================

-- 4.1 Total Revenue
CREATE OR REPLACE FUNCTION get_total_revenue()
RETURNS numeric
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT COALESCE(SUM(quantity * price), 0) FROM combined_sales;
$$;

-- 4.2 Monthly Sales Growth
CREATE OR REPLACE FUNCTION get_monthly_sales()
RETURNS TABLE (
    month text,
    revenue numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH monthly_data AS (
        SELECT 
            DATE_TRUNC('month', date) AS month_start,
            SUM(quantity * price) AS total_revenue
        FROM combined_sales
        WHERE date >= (CURRENT_DATE - INTERVAL '11 months')
        GROUP BY DATE_TRUNC('month', date)
    )
    SELECT 
        to_char(month_start, 'Mon') AS month,
        total_revenue AS revenue
    FROM monthly_data
    ORDER BY month_start ASC;
$$;

-- 4.3 Best Selling Products
CREATE OR REPLACE FUNCTION get_top_products()
RETURNS TABLE (
    name text,
    category text,
    sales bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT 
        product_name AS name,
        category,
        SUM(quantity) AS sales
    FROM combined_sales
    GROUP BY product_name, category
    ORDER BY SUM(quantity) DESC
    LIMIT 5;
$$;

-- 4.4 Sales by Category
CREATE OR REPLACE FUNCTION get_category_distribution()
RETURNS TABLE (
    name text,
    value numeric
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    WITH total AS (
        SELECT NULLIF(SUM(quantity * price), 0) AS calc_total FROM combined_sales
    )
    SELECT 
        category AS name,
        -- Calculate percentage out of 100 returning numeric mapped to our charts format
        ROUND((SUM(quantity * price) / (SELECT calc_total FROM total) * 100), 1) AS value
    FROM combined_sales
    GROUP BY category
    ORDER BY value DESC;
$$;

-- ==========================================
-- 5. Mock Data Seeding
-- ==========================================

-- Empty existing tables to prevent duplicates if ran multiple times
TRUNCATE TABLE store_sales, online_sales;

-- Insert Store Sales (10 Records spanning recent months)
INSERT INTO store_sales (date, product_name, category, quantity, price, city) VALUES 
(CURRENT_DATE - INTERVAL '2 days', 'Wireless Earbuds', 'Electronics', 3, 149.99, 'Mumbai'),
(CURRENT_DATE - INTERVAL '5 days', 'Ergonomic Chair', 'Furniture', 1, 350.00, 'Delhi'),
(CURRENT_DATE - INTERVAL '15 days', 'Smart Watch', 'Electronics', 2, 299.99, 'Bangalore'),
(CURRENT_DATE - INTERVAL '25 days', 'Yoga Mat', 'Accessories', 5, 29.99, 'Chennai'),
(CURRENT_DATE - INTERVAL '1 month', 'Cotton T-Shirt', 'Clothing', 10, 19.99, 'Mumbai'),
(CURRENT_DATE - INTERVAL '45 days', 'Bluetooth Speaker', 'Electronics', 4, 89.99, 'Hyderabad'),
(CURRENT_DATE - INTERVAL '2 months', 'Standing Desk', 'Furniture', 1, 550.00, 'Pune'),
(CURRENT_DATE - INTERVAL '3 months', 'Running Shoes', 'Clothing', 2, 120.00, 'Delhi'),
(CURRENT_DATE - INTERVAL '4 months', 'Mechanical Keyboard', 'Electronics', 3, 139.99, 'Bangalore'),
(CURRENT_DATE - INTERVAL '5 months', 'Coffee Maker', 'Home Appliances', 2, 85.00, 'Ahmedabad');

-- Insert Online Sales (10 records)
INSERT INTO online_sales (date, product_name, category, quantity, price, location) VALUES 
(CURRENT_DATE - INTERVAL '1 days', 'Smart Watch', 'Electronics', 1, 299.99, 'Kerala'),
(CURRENT_DATE - INTERVAL '3 days', 'USB-C Hub', 'Accessories', 8, 45.00, 'Goa'),
(CURRENT_DATE - INTERVAL '10 days', 'Wireless Earbuds', 'Electronics', 4, 149.99, 'Rajasthan'),
(CURRENT_DATE - INTERVAL '20 days', 'Desk Lamp', 'Home Appliances', 3, 35.00, 'Punjab'),
(CURRENT_DATE - INTERVAL '1 month', 'Winter Jacket', 'Clothing', 2, 180.00, 'Himachal'),
(CURRENT_DATE - INTERVAL '1.5 months', 'Gaming Mouse', 'Electronics', 5, 75.00, 'Haryana'),
(CURRENT_DATE - INTERVAL '2.5 months', 'Mechanical Keyboard', 'Electronics', 4, 139.99, 'Gujarat'),
(CURRENT_DATE - INTERVAL '3.5 months', 'Office Chair', 'Furniture', 2, 350.00, 'Maharashtra'),
(CURRENT_DATE - INTERVAL '4.5 months', 'Water Bottle', 'Accessories', 15, 25.00, 'Tamil Nadu'),
(CURRENT_DATE - INTERVAL '6 months', 'Blender', 'Home Appliances', 3, 110.00, 'Karnataka');
