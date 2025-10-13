/*
  # Create Products Table

  1. New Tables
    - `products`
      - `id` (uuid, primary key) - Unique identifier for each product
      - `name` (text) - Product name (e.g., "Partyzelt 5x5m")
      - `description` (text) - Detailed product description
      - `type` (text) - Product category/type
      - `price` (numeric) - Daily rental price in euros
      - `image` (text) - URL to product image
      - `available` (boolean) - Product availability status
      - `specifications` (jsonb) - Technical specs (material, UV protection, etc.)
      - `features` (jsonb) - Array of product features
      - `dimensions` (text) - Product dimensions (e.g., "5x5m")
      - `capacity` (text) - Capacity information (e.g., "50 persons standing")
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `products` table
    - Add policy for public read access (customers can view products)
    - Add policy for authenticated admin users to manage products
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL DEFAULT 'tent',
  price numeric NOT NULL DEFAULT 0,
  image text,
  available boolean NOT NULL DEFAULT true,
  specifications jsonb DEFAULT '{}'::jsonb,
  features jsonb DEFAULT '[]'::jsonb,
  dimensions text,
  capacity text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products"
  ON products
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products
  FOR DELETE
  TO authenticated
  USING (true);