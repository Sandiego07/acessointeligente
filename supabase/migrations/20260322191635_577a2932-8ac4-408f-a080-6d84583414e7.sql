
-- Rename column placa to codigo in veiculos table
ALTER TABLE public.veiculos RENAME COLUMN placa TO codigo;

-- Add anon SELECT policy for external scripts
CREATE POLICY "Anon users can select veiculos"
ON public.veiculos
FOR SELECT
TO anon
USING (true);
