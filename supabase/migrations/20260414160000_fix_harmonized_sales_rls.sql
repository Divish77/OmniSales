-- Add an explicit policy to allow anon/authenticated users to insert into harmonized_sales
-- This is necessary because the trigger from online_sales/store_sales runs under the invoking user's context,
-- and RLS blocks the INSERT into harmonized_sales without it.

CREATE POLICY "Enable insert for all users on harmonized_sales" ON public.harmonized_sales
  FOR INSERT
  WITH CHECK (true);
