
CREATE TABLE IF NOT EXISTS public.settings (
    key text PRIMARY KEY,
    value text
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for settings" ON public.settings FOR ALL USING (true);

-- Insert default values if they don't exist
INSERT INTO public.settings (key, value) VALUES ('bank_name', 'Chase Business Checking') ON CONFLICT DO NOTHING;
INSERT INTO public.settings (key, value) VALUES ('account_last4', '9210') ON CONFLICT DO NOTHING;
