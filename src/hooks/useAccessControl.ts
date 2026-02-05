import { useState, useEffect, useCallback, useRef } from 'react';
import type { Vehicle, AccessLog, GateState } from '@/types/vehicle';

const STORAGE_KEYS = {
  VEHICLES: 'vehicle_access_vehicles',
  LOGS: 'vehicle_access_logs',
};

const DEBOUNCE_TIME_MS = 10000; // 10 seconds debounce
const RELAY_IP = '192.168.1.100'; // Example Tasmota/ESP32 IP

// Simulated plates for demo
const DEMO_PLATES = [
  'ABC-1234',
  'XYZ-5678',
  'DEF-9012',
  'GHI-3456',
  'JKL-7890',
];

export function useAccessControl() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [gateState, setGateState] = useState<GateState>({
    isOpen: false,
    lastCommandTime: 0,
    lastPlate: null,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState<string | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedVehicles = localStorage.getItem(STORAGE_KEYS.VEHICLES);
    const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);

    if (storedVehicles) {
      setVehicles(JSON.parse(storedVehicles));
    } else {
      // Initialize with demo vehicles
      const demoVehicles: Vehicle[] = [
        {
          id: '1',
          plate: 'ABC-1234',
          model: 'Toyota Corolla',
          color: 'Prata',
          ownerName: 'João Silva',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          plate: 'XYZ-5678',
          model: 'Honda Civic',
          color: 'Preto',
          ownerName: 'Maria Santos',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          plate: 'DEF-9012',
          model: 'Volkswagen Gol',
          color: 'Branco',
          ownerName: 'Pedro Costa',
          status: 'inactive',
          createdAt: new Date().toISOString(),
        },
      ];
      setVehicles(demoVehicles);
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(demoVehicles));
    }

    if (storedLogs) {
      setAccessLogs(JSON.parse(storedLogs));
    }
  }, []);

  // Persist vehicles to localStorage
  useEffect(() => {
    if (vehicles.length > 0) {
      localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    }
  }, [vehicles]);

  // Persist logs to localStorage
  useEffect(() => {
    if (accessLogs.length > 0) {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(accessLogs));
    }
  }, [accessLogs]);

  // Auto-close gate after 5 seconds
  useEffect(() => {
    if (gateState.isOpen) {
      const timeout = setTimeout(() => {
        setGateState(prev => ({ ...prev, isOpen: false }));
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [gateState.isOpen]);

  const addVehicle = useCallback((vehicle: Omit<Vehicle, 'id' | 'createdAt'>) => {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setVehicles(prev => [...prev, newVehicle]);
    return newVehicle;
  }, []);

  const updateVehicle = useCallback((id: string, updates: Partial<Vehicle>) => {
    setVehicles(prev =>
      prev.map(v => (v.id === id ? { ...v, ...updates } : v))
    );
  }, []);

  const deleteVehicle = useCallback((id: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  }, []);

  const checkAccess = useCallback((plate: string): { granted: boolean; vehicle?: Vehicle } => {
    const vehicle = vehicles.find(
      v => v.plate.toUpperCase() === plate.toUpperCase()
    );
    
    if (vehicle && vehicle.status === 'active') {
      return { granted: true, vehicle };
    }
    
    return { granted: false, vehicle };
  }, [vehicles]);

  const sendGateCommand = useCallback(async (action: 'open' | 'close') => {
    // Simulated HTTP request to relay
    console.log(`[GATE CONTROL] Sending ${action} command to ${RELAY_IP}`);
    
    // In real implementation:
    // await fetch(`http://${RELAY_IP}/cm?cmnd=Power%20${action === 'open' ? 'On' : 'Off'}`);
    
    return { success: true, action };
  }, []);

  const processPlateDetection = useCallback(async (plate: string) => {
    const now = Date.now();
    
    // Debounce check - prevent multiple opens for same plate within time window
    if (
      gateState.lastPlate === plate &&
      now - gateState.lastCommandTime < DEBOUNCE_TIME_MS
    ) {
      console.log(`[DEBOUNCE] Ignoring repeated detection of plate ${plate}`);
      return;
    }

    const { granted, vehicle } = checkAccess(plate);

    // Create access log entry
    const logEntry: AccessLog = {
      id: crypto.randomUUID(),
      plate,
      timestamp: new Date().toISOString(),
      accessGranted: granted,
      vehicleId: vehicle?.id,
      ownerName: vehicle?.ownerName,
      model: vehicle?.model,
    };

    setAccessLogs(prev => [logEntry, ...prev].slice(0, 100)); // Keep last 100 logs

    if (granted) {
      await sendGateCommand('open');
      setGateState({
        isOpen: true,
        lastCommandTime: now,
        lastPlate: plate,
      });
    }

    return logEntry;
  }, [checkAccess, gateState, sendGateCommand]);

  const manualOpenGate = useCallback(async () => {
    await sendGateCommand('open');
    
    const logEntry: AccessLog = {
      id: crypto.randomUUID(),
      plate: 'MANUAL',
      timestamp: new Date().toISOString(),
      accessGranted: true,
      ownerName: 'Abertura Manual',
    };
    
    setAccessLogs(prev => [logEntry, ...prev].slice(0, 100));
    setGateState(prev => ({
      ...prev,
      isOpen: true,
      lastCommandTime: Date.now(),
    }));
  }, [sendGateCommand]);

  // Simulated plate detection for demo
  const startSimulatedScanning = useCallback(() => {
    setIsScanning(true);
    
    scanIntervalRef.current = setInterval(() => {
      // Randomly detect a plate (30% chance every 3 seconds)
      if (Math.random() < 0.3) {
        const randomPlate = DEMO_PLATES[Math.floor(Math.random() * DEMO_PLATES.length)];
        setDetectedPlate(randomPlate);
        processPlateDetection(randomPlate);
        
        // Clear detected plate after 2 seconds
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const clearLogs = useCallback(() => {
    setAccessLogs([]);
    localStorage.removeItem(STORAGE_KEYS.LOGS);
  }, []);

  return {
    // State
    vehicles,
    accessLogs,
    gateState,
    isScanning,
    detectedPlate,
    
    // Vehicle CRUD
    addVehicle,
    updateVehicle,
    deleteVehicle,
    
    // Access control
    checkAccess,
    processPlateDetection,
    manualOpenGate,
    
    // Scanning simulation
    startSimulatedScanning,
    stopSimulatedScanning,
    
    // Logs
    clearLogs,
  };
}
