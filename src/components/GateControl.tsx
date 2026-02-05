import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DoorOpen, AlertTriangle, Lock, Unlock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GateState } from '@/types/vehicle';

interface GateControlProps {
  gateState: GateState;
  onManualOpen: () => void;
}

export function GateControl({ gateState, onManualOpen }: GateControlProps) {
  const timeSinceLastCommand = gateState.lastCommandTime 
    ? Math.floor((Date.now() - gateState.lastCommandTime) / 1000)
    : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DoorOpen className="h-5 w-5 text-primary" />
          Controle do Portão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gate Status Display */}
        <div className={cn(
          "p-6 rounded-lg border-2 text-center transition-all duration-300",
          gateState.isOpen 
            ? "bg-success/10 border-success glow-success" 
            : "bg-secondary border-border"
        )}>
          <div className="flex flex-col items-center gap-2">
            {gateState.isOpen ? (
              <Unlock className="h-12 w-12 text-success" />
            ) : (
              <Lock className="h-12 w-12 text-muted-foreground" />
            )}
            <span className={cn(
              "text-2xl font-bold",
              gateState.isOpen ? "text-success" : "text-foreground"
            )}>
              {gateState.isOpen ? 'ABERTO' : 'FECHADO'}
            </span>
            {gateState.isOpen && (
              <span className="text-sm text-muted-foreground">
                Fechamento automático em breve...
              </span>
            )}
          </div>
        </div>

        {/* Last Command Info */}
        {gateState.lastPlate && (
          <div className="text-sm text-muted-foreground text-center">
            Última placa: <span className="font-mono font-medium text-foreground">{gateState.lastPlate}</span>
            {timeSinceLastCommand !== null && (
              <> • há {timeSinceLastCommand}s</>
            )}
          </div>
        )}

        {/* Emergency Manual Open Button */}
        <Button
          variant="destructive"
          className="w-full h-14 text-lg font-semibold glow-destructive"
          onClick={onManualOpen}
        >
          <AlertTriangle className="mr-2 h-5 w-5" />
          Abertura Manual de Emergência
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Use apenas em emergências. Todas as aberturas manuais são registradas.
        </p>
      </CardContent>
    </Card>
  );
}
