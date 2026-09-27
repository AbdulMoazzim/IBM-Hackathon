CREATE POLICY "Anyone can read orders"
ON orders
FOR SELECT
USING (true);
