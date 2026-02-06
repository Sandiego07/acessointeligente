
-- Tabela de veículos autorizados
CREATE TABLE public.veiculos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL UNIQUE,
  proprietario TEXT NOT NULL,
  modelo TEXT NOT NULL,
  cor TEXT DEFAULT '',
  status BOOLEAN NOT NULL DEFAULT true,
  data_cadastro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de logs de acesso
CREATE TABLE public.logs_acesso (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  placa TEXT NOT NULL,
  horario TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status_acesso TEXT NOT NULL CHECK (status_acesso IN ('Autorizado', 'Negado')),
  proprietario TEXT,
  modelo TEXT,
  foto_url TEXT
);

-- Enable RLS
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_acesso ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can do everything on veiculos
CREATE POLICY "Authenticated users can view veiculos"
  ON public.veiculos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert veiculos"
  ON public.veiculos FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update veiculos"
  ON public.veiculos FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Authenticated users can delete veiculos"
  ON public.veiculos FOR DELETE TO authenticated USING (true);

-- RLS: authenticated users can read/insert logs
CREATE POLICY "Authenticated users can view logs"
  ON public.logs_acesso FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert logs"
  ON public.logs_acesso FOR INSERT TO authenticated WITH CHECK (true);

-- Allow service_role (edge functions) to insert logs and read veiculos
CREATE POLICY "Service role can read veiculos"
  ON public.veiculos FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role can insert logs"
  ON public.logs_acesso FOR INSERT TO service_role WITH CHECK (true);

-- Enable Realtime on logs_acesso
ALTER PUBLICATION supabase_realtime ADD TABLE public.logs_acesso;
