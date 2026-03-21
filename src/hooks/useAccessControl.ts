import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { VeiculoDB, LogAcessoDB } from '@/types/vehicle';

const DEBOUNCE_TIME_MS = 10000;

// Placas simuladas para demonstração
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

  // Busca veículos no banco
  const fetchVehicles = useCallback(async () => {
    const { data, error } = await supabase
      .from('veiculos')
      .select('*')
      .order('data_cadastro', { ascending: false });
    if (!error && data) setVehicles(data);
  }, []);

  // Busca logs no banco
  const fetchLogs = useCallback(async () => {
    const result = await supabase
      .from('logs_acesso')
      .select('*')
      .order('horario', { ascending: false })
      .limit(100);
    if (!result.error && result.data) setAccessLogs(result.data as LogAcessoDB[]);
  }, []);

  // Carga inicial
  useEffect(() => {
    Promise.all([fetchVehicles(), fetchLogs()]).then(() => setLoading(false));
  }, [fetchVehicles, fetchLogs]);

  // Inscrição em tempo real para os Logs
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

  // Fechamento automático do portão após 5s
  useEffect(() => {
    if (gateState.isOpen) {
      const t = setTimeout(() => setGateState((p) => ({ ...p, isOpen: false })), 5000);
      return () => clearTimeout(t);
    }
  }, [gateState.isOpen]);

  // ADICIONAR VEÍCULO (Com limpeza de strings vazias para NULL)
  const addVehicle = useCallback(async (vehicle: { placa: string; proprietario: string; modelo: string; cor: string | null; status: boolean; tag: string | null; tipo: string; marca: string }) => {
    const payload = {
      placa: vehicle.placa.toUpperCase().trim(),
      proprietario: vehicle.proprietario.trim(),
      modelo: vehicle.modelo.trim(),
      cor: vehicle.cor?.trim() || null,
      status: vehicle.status,
      tag: vehicle.tag?.trim() ? vehicle.tag.toUpperCase().trim() : null,
      tipo: vehicle.tipo,
      marca: vehicle.marca.trim(),
    };

    const { data, error } = await supabase
      .from('veiculos')
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      // Atualiza a tela na hora com o novo veículo
      setVehicles((prev) => [data as VeiculoDB, ...prev]);
    }
    return error;
  }, []);

  // ATUALIZAR VEÍCULO
  const updateVehicle = useCallback(async (id: string, updates: Partial<VeiculoDB>) => {
    const { error } = await supabase
      .from('veiculos')
      .update(updates)
      .eq('id', id);

    if (!error) {
      // Atualiza o estado local para refletir a mudança
      setVehicles((prev) => prev.map(v => v.id === id ? { ...v, ...updates } : v));
    }
    return error;
  }, []);

  // DELETAR VEÍCULO (Corrigido para ser instantâneo)
  const deleteVehicle = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('veiculos')
      .delete()
      .eq('id', id);

    if (!error) {
      // Remove da lista IMEDIATAMENTE na interface
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } else {
      console.error("Erro ao deletar no Supabase:", error);
    }
    return error;
  }, []);

  const sendGateCommand = useCallback(async () => {
    const ip = localStorage.getItem('esp32_ip') || '192.168.1.100';
    try {
      await fetch(`http://${ip}/abrir`, { mode: 'no-cors' });
      return { success: true };
    } catch {
      return { success: false, error: 'ESP32 offline' };
    }
  }, []);

  const processPlateDetection = useCallback(async (plateOrTag: string) => {
    const now = Date.now();
    const input = plateOrTag.toUpperCase().trim();
    if (gateState.lastPlate === input && now - gateState.lastCommandTime < DEBOUNCE_TIME_MS) {
      return;
    }

    const veiculo = vehicles.find(
      (v) => (v.placa.toUpperCase() === input || (v.tag?.toUpperCase() === input)) && v.status === true
    );
    const autorizado = !!veiculo;

    await supabase.from('logs_acesso').insert({
      placa: veiculo?.placa || input,
      status_acesso: autorizado ? 'Autorizado' : 'Negado',
      proprietario: veiculo?.proprietario || null,
      modelo: veiculo?.modelo || null,
    });

    if (autorizado) {
      await sendGateCommand();
      setGateState({ isOpen: true, lastCommandTime: now, lastPlate: input });
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
