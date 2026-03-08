import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VeiculoDB, LogAcessoDB } from '@/types/vehicle';

const DEBOUNCE_TIME_MS = 10000;

// Simulated plates for demo
const DEMO_PLATES = ['ABC-1234', 'XYZ-5678', 'DEF-9012', 'GHI-3456', 'JKL-7890'];

export function useAccessControl() {
  const [vehicles, setVehicles] = useState<VeiculoDB[]>([]);
  const [accessLogs, setAccessLogs] = useState<LogAcessoDB[]>([]);
  const [gateState, setGateState] = useState({
    isOpen: false,
    lastCommandTime: 0,
    lastPlate: null as string | null,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch vehicles
  const fetchVehicles = useCallback(async () => {
    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .order('data_cadastro', { ascending: false });
    if (!error && data) setVehicles(data);
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    const result = await supabase
      .from('logs_acesso')
      .select('*')
      .order('horario', { ascending: false })
      .limit(100);
    if (!result.error && result.data) setAccessLogs(result.data as LogAcessoDB[]);
  }, []);

  // Initial load
  useEffect(() => {
    Promise.all([fetchVehicles(), fetchLogs()]).then(() => setLoading(false));
  }, [fetchVehicles, fetchLogs]);

  // Realtime subscription for logs
  useEffect(() => {
    const channel = supabase
      .channel('logs_acesso_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs_acesso' },
        (payload) => {
          setAccessLogs((prev) => [payload.new as LogAcessoDB, ...prev].slice(0, 100));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-close gate after 5s
  useEffect(() => {
    if (gateState.isOpen) {
      const t = setTimeout(() => setGateState((p) => ({ ...p, isOpen: false })), 5000);
      return () => clearTimeout(t);
    }
  }, [gateState.isOpen]);

  const addVehicle = useCallback(async (vehicle: { placa: string; proprietario: string; modelo: string; cor: string; status: boolean; tag: string; tipo: string; marca: string }) => {
    const { error } = await supabase.from('veiculos').insert({
      placa: vehicle.placa.toUpperCase().trim(),
      proprietario: vehicle.proprietario,
      modelo: vehicle.modelo,
      cor: vehicle.cor,
      status: vehicle.status,
      tag: vehicle.tag.toUpperCase().trim(),
      tipo: vehicle.tipo,
      marca: vehicle.marca,
    });
    if (!error) fetchVehicles();
    return error;
  }, [fetchVehicles]);

  const updateVehicle = useCallback(async (id: string, updates: Partial<VeiculoDB>) => {
    const { error } = await supabase.from('veiculos').update(updates).eq('id', id);
    if (!error) fetchVehicles();
    return error;
  }, [fetchVehicles]);

  const deleteVehicle = useCallback(async (id: string) => {
    const { error } = await supabase.from('veiculos').delete().eq('id', id);
    if (!error) fetchVehicles();
    return error;
  }, [fetchVehicles]);

  const sendGateCommand = useCallback(async () => {
    const ip = localStorage.getItem('esp32_ip') || '192.168.1.100';
    try {
      await fetch(`http://${ip}/abrir`, { mode: 'no-cors' });
      return { success: true };
    } catch {
      return { success: false, error: 'ESP32 offline' };
    }
  }, []);

  const processPlateDetection = useCallback(async (plate: string) => {
    const now = Date.now();
    if (gateState.lastPlate === plate && now - gateState.lastCommandTime < DEBOUNCE_TIME_MS) {
      console.log(`[DEBOUNCE] Ignoring repeated detection of ${plate}`);
      return;
    }

    const veiculo = vehicles.find(
      (v) => v.placa.toUpperCase() === plate.toUpperCase() && v.status === true
    );
    const autorizado = !!veiculo;

    // Log to database
    await supabase.from('logs_acesso').insert({
      placa: plate.toUpperCase(),
      status_acesso: autorizado ? 'Autorizado' : 'Negado',
      proprietario: veiculo?.proprietario || null,
      modelo: veiculo?.modelo || null,
    });

    if (autorizado) {
      await sendGateCommand();
      setGateState({ isOpen: true, lastCommandTime: now, lastPlate: plate });
    }
  }, [vehicles, gateState, sendGateCommand]);

  const manualOpenGate = useCallback(async () => {
    const result = await sendGateCommand();

    await supabase.from('logs_acesso').insert({
      placa: 'MANUAL',
      status_acesso: 'Autorizado',
      proprietario: 'Abertura Manual',
    });

    setGateState((p) => ({ ...p, isOpen: true, lastCommandTime: Date.now() }));
    return result;
  }, [sendGateCommand]);

  const startSimulatedScanning = useCallback(() => {
    setIsScanning(true);
    scanIntervalRef.current = setInterval(() => {
      if (Math.random() < 0.3) {
        const plate = DEMO_PLATES[Math.floor(Math.random() * DEMO_PLATES.length)];
        setDetectedPlate(plate);
        processPlateDetection(plate);
        setTimeout(() => setDetectedPlate(null), 2000);
      }
    }, 3000);
  }, [processPlateDetection]);

  const stopSimulatedScanning = useCallback(() => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  const clearLogs = useCallback(async () => {
    // We don't delete from DB, just clear local view
    setAccessLogs([]);
  }, []);

  return {
    vehicles,
    accessLogs,
    gateState,
    isScanning,
    detectedPlate,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    manualOpenGate,
    startSimulatedScanning,
    stopSimulatedScanning,
    clearLogs,
    sendGateCommand,
  };
}
