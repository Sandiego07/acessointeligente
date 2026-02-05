import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Play, Pause, Video, VideoOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect, useCallback } from 'react';

interface CameraFeedProps {
  isScanning: boolean;
  detectedPlate: string | null;
  onStartScanning: () => void;
  onStopScanning: () => void;
}

type CameraMode = 'simulated' | 'webcam';
type WebcamStatus = 'idle' | 'requesting' | 'active' | 'error';

export function CameraFeed({
  isScanning,
  detectedPlate,
  onStartScanning,
  onStopScanning,
}: CameraFeedProps) {
  const [cameraMode, setCameraMode] = useState<CameraMode>('simulated');
  const [webcamStatus, setWebcamStatus] = useState<WebcamStatus>('idle');
  const [webcamError, setWebcamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopWebcam = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setWebcamStatus('idle');
    setWebcamError(null);
  }, []);

  const startWebcam = useCallback(async () => {
    setWebcamStatus('requesting');
    setWebcamError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setWebcamStatus('active');
    } catch (error) {
      console.error('[WEBCAM] Error accessing camera:', error);
      setWebcamStatus('error');
      
      if (error instanceof DOMException) {
        switch (error.name) {
          case 'NotAllowedError':
            setWebcamError('Permissão de câmera negada. Autorize o acesso nas configurações do navegador.');
            break;
          case 'NotFoundError':
            setWebcamError('Nenhuma câmera encontrada no dispositivo.');
            break;
          case 'NotReadableError':
            setWebcamError('Câmera em uso por outro aplicativo.');
            break;
          default:
            setWebcamError(`Erro ao acessar câmera: ${error.message}`);
        }
      } else {
        setWebcamError('Erro desconhecido ao acessar a câmera.');
      }
    }
  }, []);

  const toggleCameraMode = useCallback(() => {
    if (cameraMode === 'simulated') {
      setCameraMode('webcam');
      startWebcam();
    } else {
      stopWebcam();
      setCameraMode('simulated');
    }
  }, [cameraMode, startWebcam, stopWebcam]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  // Stop webcam when switching away from webcam mode
  useEffect(() => {
    if (cameraMode === 'simulated') {
      stopWebcam();
    }
  }, [cameraMode, stopWebcam]);

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg">
            <Camera className="h-5 w-5 text-primary" />
            Câmera - Reconhecimento de Placas
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCameraMode}
            className="text-xs"
          >
            {cameraMode === 'simulated' ? (
              <>
                <Video className="mr-1 h-3 w-3" />
                Webcam Real
              </>
            ) : (
              <>
                <VideoOff className="mr-1 h-3 w-3" />
                Modo Simulado
              </>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Camera Feed Container */}
        <div className="relative aspect-video bg-secondary rounded-lg overflow-hidden border border-border">
          {/* Simulated Mode */}
          {cameraMode === 'simulated' && (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
              <div className="text-muted-foreground text-sm">
                {isScanning ? 'Monitorando entrada...' : 'Câmera pausada'}
              </div>
            </div>
          )}

          {/* Webcam Mode */}
          {cameraMode === 'webcam' && (
            <>
              {webcamStatus === 'requesting' && (
                <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-sm">Solicitando acesso à câmera...</p>
                  </div>
                </div>
              )}

              {webcamStatus === 'error' && (
                <div className="absolute inset-0 bg-secondary flex items-center justify-center p-4">
                  <div className="text-center">
                    <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
                    <p className="text-sm text-destructive font-medium mb-2">Erro na Câmera</p>
                    <p className="text-xs text-muted-foreground max-w-xs">{webcamError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startWebcam}
                      className="mt-3"
                    >
                      Tentar Novamente
                    </Button>
                  </div>
                </div>
              )}

              <video
                ref={videoRef}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover",
                  webcamStatus !== 'active' && "hidden"
                )}
                playsInline
                muted
                autoPlay
              />
            </>
          )}

          {/* Scanning overlay - works for both modes */}
          {isScanning && (webcamStatus === 'active' || cameraMode === 'simulated') && (
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
            disabled={cameraMode === 'webcam' && webcamStatus !== 'active'}
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
          <span>
            {cameraMode === 'webcam' 
              ? 'Modo: Webcam Real (OCR não implementado)' 
              : 'Modelo: YOLOv8 + OCR (Simulado)'
            }
          </span>
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
