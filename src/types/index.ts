export type VehicleType = 'motor' | 'mobil' | 'truk';

export interface Vehicle {
  id: string;
  userId: string;
  plateNumber: string;
  type: VehicleType;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  balance: number;
  vehicles: Vehicle[];
  isAdmin: boolean;
  createdAt: string;
}

export interface ParkingLocation {
  id: string;
  name: string;
  address: string;
  hourlyRate: number;
  totalSlots: number;
  availableSlots: number;
}

export interface ParkingSession {
  id: string;
  userId: string;
  vehicleId: string;
  locationId: string;
  entryTime: string;
  exitTime: string | null;
  fee: number | null;
  status: 'active' | 'completed';
}

export interface Transaction {
  id: string;
  userId: string;
  vehicleId: string;
  parkingSessionId: string;
  amount: number;
  paymentMethod: 'nfc' | 'qr' | 'ewallet' | 'debit' | 'credit';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface TopUp {
  id: string;
  userId: string;
  amount: number;
  method: 'bank_transfer' | 'debit' | 'credit' | 'gopay' | 'ovo' | 'dana' | 'shopeepay';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Receipt {
  id: string;
  transactionId: string;
  parkingSession: ParkingSession;
  location: ParkingLocation;
  vehicle: Vehicle;
  amount: number;
  paymentMethod: string;
  createdAt: string;
}
