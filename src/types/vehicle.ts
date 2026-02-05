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
