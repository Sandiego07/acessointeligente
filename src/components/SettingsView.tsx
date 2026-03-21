import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Wifi, Save, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function SettingsView() {
  const [espIp, setEspIp] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setEspIp(localStorage.getItem('esp32_ip') || '192.168.1.100');
  }, []);

  const handleSave = () => {
    localStorage.setItem('esp32_ip', espIp.trim());
    toast({ title: 'Configurações salvas', description: `IP do ESP32: ${espIp.trim()}` });
  };

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verificar-placa`;

  const pythonExample = `import requests
from supabase import create_client

# Autenticar primeiro para obter o token JWT
supabase = create_client("${import.meta.env.VITE_SUPABASE_URL}", "${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}")
session = supabase.auth.sign_in_with_password({"email": "seu@email.com", "password": "sua_senha"})
token = session.session.access_token

url = "${apiUrl}"
headers = {
    "Content-Type": "application/json",
    "apikey": "${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}",
    "Authorization": f"Bearer {token}"
}

response = requests.post(url, json={"placa": "ABC1234"}, headers=headers)
print(response.json())
# {"autorizado": true, "placa": "ABC1234", "proprietario": "João", "modelo": "Corolla"}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copiado!', description: 'Código copiado para a área de transferência.' });
  };

  return (
    <div className="space-y-6">
      {/* ESP32 Config */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Wifi className="h-5 w-5 text-primary" />
            Configuração do ESP32
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="esp-ip">IP Local do ESP32</Label>
            <div className="flex gap-2">
              <Input
                id="esp-ip"
                placeholder="192.168.1.100"
                value={espIp}
                onChange={(e) => setEspIp(e.target.value)}
                className="font-mono"
              />
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Endereço IP do seu ESP32/Tasmota na rede local. O sistema fará GET para http://[IP]/abrir
            </p>
          </div>
        </CardContent>
      </Card>

      {/* API Integration */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <ExternalLink className="h-5 w-5 text-primary" />
            Integração com Python (API)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Endpoint da API</Label>
            <div className="flex gap-2">
              <Input value={apiUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="icon" onClick={() => copyToClipboard(apiUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Exemplo em Python</Label>
            <div className="relative">
              <pre className="bg-secondary rounded-lg p-4 text-xs font-mono overflow-x-auto text-secondary-foreground">
                {pythonExample}
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(pythonExample)}
              >
                <Copy className="h-3 w-3 mr-1" />
                Copiar
              </Button>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p><strong>Como funciona:</strong></p>
            <p>1. Seu script Python envia POST com {"{"}"placa": "ABC1234"{"}"}</p>
            <p>2. O servidor verifica se a placa está cadastrada e ativa</p>
            <p>3. Registra o acesso no log (Autorizado/Negado)</p>
            <p>4. Retorna {"{"}"autorizado": true/false{"}"}</p>
            <p>5. Se autorizado, seu script pode enviar comando ao ESP32</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
