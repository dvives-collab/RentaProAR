export type IndexType = 'IPC' | 'ICL';
export type FrequencyMonths = 1 | 2 | 3 | 6;
export type SplitMode = 'IGUAL' | 'PORCENTAJE' | 'UNICO';

export interface ClientRecord {
  id: string;
  fullName: string;
  dniCuit: string;
  email: string;
  phone: string;
  propertyId: string;
  role: 'INQUILINO' | 'PROPIETARIO';
  status: 'ACTIVO' | 'PENDIENTE' | 'INACTIVO';
  notes: string;
  version?: number;
}

export interface PropertyContract {
  id: string;
  unitName: string;
  address: string;
  clientId: string;
  tenantName: string;
  initialAmount: number;
  indexType: IndexType;
  frequencyMonths: FrequencyMonths;
  startDate: string;
  endDate: string;
  status: 'ACTIVO' | 'POR_VENCER' | 'FINALIZADO';
  version?: number;
}

export interface EconomicIndex {
  period: string; // YYYY-MM
  ipcMonthlyPct: number;
  iclValue: number;
  source?: string;
}

export interface TaxDocument {
  id: string;
  period: string;
  serviceName: string;
  provider: string;
  totalAmount: number;
  splitMode: SplitMode;
  assignedPropertyIds: string[];
  customPercentages: Record<string, number>;
  fileName: string;
  mimeType: string;
  localObjectUrl?: string;
  driveFileId?: string;
  drivePreviewUrl?: string;
  driveDownloadUrl?: string;
  driveFolderUrl?: string;
  version?: number;
}

export interface CloudConnectionConfig {
  appsScriptUrl: string;
  driveFolderUrl: string;
  sheetUrl: string;
  isConnected: boolean;
  lastSyncAt: string | null;
}
