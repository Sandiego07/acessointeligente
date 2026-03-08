
ALTER TABLE public.veiculos 
  ADD COLUMN IF NOT EXISTS tag text,
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'carro',
  ADD COLUMN IF NOT EXISTS marca text NOT NULL DEFAULT '';

UPDATE public.veiculos SET tag = 'TAG-' || LEFT(id::text, 8) WHERE tag IS NULL;

ALTER TABLE public.veiculos ALTER COLUMN tag SET NOT NULL;
ALTER TABLE public.veiculos ADD CONSTRAINT veiculos_tag_unique UNIQUE (tag);
