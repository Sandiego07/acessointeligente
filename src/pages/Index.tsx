import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Shield, Car, ClipboardList, Settings, AlertTriangle, LogOut } from 'lucide-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { useAuth } from '@/hooks/useAuth';
import { CameraFeed } from '@/components/CameraFeed';
import { GateControl } from '@/components/GateControl';
import { AccessLogView } from '@/components/AccessLogView';
import { VehicleManagement } from '@/components/VehicleManagement';
import { DashboardStats } from '@/components/DashboardStats';
import { SettingsView } from '@/components/SettingsView';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const {
    vehicles, accessLogs, gateState, isScanning, detectedPlate, loading,
    addVehicle, updateVehicle, deleteVehicle, manualOpenGate,
    startSimulatedScanning, stopSimulatedScanning, clearLogs,
  } = useAccessControl();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [emergencyDisabled, setEmergencyDisabled] = useState(false);

  const handleEmergencyOpen = async () => {
    setEmergencyDisabled(true);
    const result = await manualOpenGate();
    if (!result.success) {
      toast({ title: 'Erro: ESP32 offline', description: 'Não foi possível conectar ao ESP32.', variant: 'destructive' });
    } else {
      toast({ title: 'Portão aberto!', description: 'Abertura de emergência registrada.' });
    }
    setTimeout(() => setEmergencyDisabled(false), 5000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Controle de Acesso Veicular</h1>
                <p className="text-xs text-muted-foreground">Sistema Inteligente de Portaria</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleEmergencyOpen}
                disabled={emergencyDisabled}
                className="glow-destructive"
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">
                  {emergencyDisabled ? 'Aguarde 5s...' : 'Emergência'}
                </span>
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="hidden sm:inline">Online</span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <DashboardStats vehicles={vehicles} logs={accessLogs} />
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Veículos</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <CameraFeed isScanning={isScanning} detectedPlate={detectedPlate} onStartScanning={startSimulatedScanning} onStopScanning={stopSimulatedScanning} />
              <GateControl gateState={gateState} onManualOpen={handleEmergencyOpen} />
            </div>
            <AccessLogView logs={accessLogs.slice(0, 10)} onClearLogs={clearLogs} />
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleManagement vehicles={vehicles} onAddVehicle={addVehicle} onUpdateVehicle={updateVehicle} onDeleteVehicle={deleteVehicle} />
          </TabsContent>

          <TabsContent value="logs">
            <AccessLogView logs={accessLogs} onClearLogs={clearLogs} />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsView />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>Sistema de Controle de Acesso Veicular • Debounce: 10s • Realtime ativo</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
