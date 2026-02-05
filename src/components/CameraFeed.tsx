import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraFeedProps {
  isScanning: boolean;
  detectedPlate: string | null;
  onStartScanning: () => void;
  onStopScanning: () => void;
}

export function CameraFeed({
  isScanning,
  detectedPlate,
  onStartScanning,
  onStopScanning,
}: CameraFeedProps) {
  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-primary" />
          Câmera - Reconhecimento de Placas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Simulated Camera Feed */}
        <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden border border-border">
          {/* Simulated video background */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <div className="text-muted-foreground text-sm">
              {isScanning ? 'Monitorando entrada...' : 'Câmera pausada'}
            </div>
          </div>

          {/* Scanning overlay */}
          {isScanning && (
            <>
              {/* Scan line animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="scan-line absolute inset-x-0 h-1/4" />
              </div>

              {/* Corner markers */}
              <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary" />
              <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-primary" />
              <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-primary" />
              <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary" />

              {/* Recording indicator */}
              <div className="absolute top-3 right-3 flex items-center gap-2 bg-destructive/90 text-destructive-foreground px-2 py-1 rounded text-xs font-medium">
                <span className="w-2 h-2 bg-destructive-foreground rounded-full animate-pulse" />
                REC
              </div>
            </>
          )}

          {/* Detected Plate Overlay */}
          {detectedPlate && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <div className={cn(
                "px-6 py-3 rounded-lg font-mono text-2xl font-bold border-2",
                "bg-card glow-success border-primary text-primary"
              )}>
                {detectedPlate}
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-4 flex gap-2">
          <Button
            variant={isScanning ? 'destructive' : 'default'}
            onClick={isScanning ? onStopScanning : onStartScanning}
            className="flex-1"
          >
            {isScanning ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pausar Detecção
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Iniciar Detecção
              </>
            )}
          </Button>
        </div>

        {/* Status info */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Modelo: YOLOv8 + OCR (Simulado)</span>
          <span className={cn(
            "flex items-center gap-1",
            isScanning ? "text-primary" : "text-muted-foreground"
          )}>
            <span className={cn(
              "w-2 h-2 rounded-full",
              isScanning ? "bg-primary pulse-glow" : "bg-muted-foreground"
            )} />
            {isScanning ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
