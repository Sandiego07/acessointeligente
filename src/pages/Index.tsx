import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Car, ClipboardList, Settings } from 'lucide-react';
import { useAccessControl } from '@/hooks/useAccessControl';
import { CameraFeed } from '@/components/CameraFeed';
import { GateControl } from '@/components/GateControl';
import { AccessLogView } from '@/components/AccessLogView';
import { VehicleManagement } from '@/components/VehicleManagement';
import { DashboardStats } from '@/components/DashboardStats';

const Index = () => {
  const {
    vehicles,
    accessLogs,
    gateState,
    isScanning,
    detectedPlate,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    manualOpenGate,
    startSimulatedScanning,
    stopSimulatedScanning,
    clearLogs,
  } = useAccessControl();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Sistema Online
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats */}
        <div className="mb-6">
          <DashboardStats vehicles={vehicles} logs={accessLogs} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
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
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Camera Feed */}
              <CameraFeed
                isScanning={isScanning}
                detectedPlate={detectedPlate}
                onStartScanning={startSimulatedScanning}
                onStopScanning={stopSimulatedScanning}
              />

              {/* Gate Control */}
              <GateControl
                gateState={gateState}
                onManualOpen={manualOpenGate}
              />
            </div>

            {/* Recent Logs Preview */}
            <AccessLogView 
              logs={accessLogs.slice(0, 10)} 
              onClearLogs={clearLogs}
            />
          </TabsContent>

          <TabsContent value="vehicles">
            <VehicleManagement
              vehicles={vehicles}
              onAddVehicle={addVehicle}
              onUpdateVehicle={updateVehicle}
              onDeleteVehicle={deleteVehicle}
            />
          </TabsContent>

          <TabsContent value="logs">
            <AccessLogView 
              logs={accessLogs} 
              onClearLogs={clearLogs}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          <p>Sistema de Controle de Acesso Veicular • Debounce: 10s • Relay: 192.168.1.100</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
