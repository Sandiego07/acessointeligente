// Database types matching Supabase tables
export interface VeiculoDB {
  id: string;
  placa: string;
  proprietario: string;
  modelo: string;
  cor: string | null;
  status: boolean;
  data_cadastro: string;
  tag: string | null;
  tipo: string;
  marca: string;
}

export interface LogAcessoDB {
  id: string;
  placa: string;
  horario: string;
  status_acesso: 'Autorizado' | 'Negado';
  proprietario: string | null;
  modelo: string | null;
  foto_url: string | null;
}

// Legacy types for compatibility
export interface Vehicle {
  id: string;
  plate: string;
  model: string;
  color: string;
  ownerName: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface AccessLog {
  id: string;
  plate: string;
  timestamp: string;
  accessGranted: boolean;
  vehicleId?: string;
  ownerName?: string;
  model?: string;
  imageUrl?: string;
}

export interface GateState {
  isOpen: boolean;
  lastCommandTime: number;
  lastPlate: string | null;
}
