import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2, Users, FileText, TrendingUp, Calculator, Plus, Trash2, Eye,
  CheckCircle2, AlertCircle, Calendar, Download, Upload, RefreshCw, Share2,
  ShieldCheck, ExternalLink, Cloud, CloudOff, Database, FolderOpen, UserPlus,
  Edit3, Smartphone, Search, Copy, Check, X
} from 'lucide-react';
import {
  ClientRecord, PropertyContract, TaxDocument, EconomicIndex,
  CloudConnectionConfig, IndexType, FrequencyMonths, SplitMode
} from './types/models';
import { fileToBase64, callAppsScriptPost, fetchAllCloudData } from './services/driveSheetsApi';

const INITIAL_INDICES: EconomicIndex[] = [
  { period: '2026-01', ipcMonthlyPct: 2.3, iclValue: 21.84, source: 'INDEC / BCRA' },
  { period: '2026-02', ipcMonthlyPct: 2.1, iclValue: 22.35, source: 'INDEC / BCRA' },
  { period: '2026-03', ipcMonthlyPct: 2.4, iclValue: 22.89, source: 'INDEC / BCRA' },
  { period: '2026-04', ipcMonthlyPct: 2.0, iclValue: 23.41, source: 'INDEC / BCRA' },
  { period: '2026-05', ipcMonthlyPct: 1.9, iclValue: 23.88, source: 'INDEC / BCRA' },
  { period: '2026-06', ipcMonthlyPct: 2.2, iclValue: 24.40, source: 'INDEC / BCRA' },
  { period: '2026-07', ipcMonthlyPct: 2.1, iclValue: 24.92, source: 'INDEC / BCRA' },
  { period: '2026-08', ipcMonthlyPct: 1.8, iclValue: 25.39, source: 'INDEC / BCRA' },
  { period: '2026-09', ipcMonthlyPct: 1.9, iclValue: 25.87, source: 'INDEC / BCRA' },
  { period: '2026-10', ipcMonthlyPct: 2.0, iclValue: 26.38, source: 'INDEC / BCRA' },
  { period: '2026-11', ipcMonthlyPct: 2.1, iclValue: 26.94, source: 'INDEC / BCRA' }
];

const INITIAL_CLIENTS: ClientRecord[] = [
  {
    id: 'CLI-001',
    fullName: 'Lucía Fernández',
    dniCuit: '27-34892104-5',
    email: 'lucia.fernandez@email.com',
    phone: '+54 9 11 5432-8891',
    propertyId: 'PROP-001',
    role: 'INQUILINO',
    status: 'ACTIVO',
    notes: 'Garantía propietaria CABA. Paga puntual del 1 al 5.',
    version: 1
  },
  {
    id: 'CLI-002',
    fullName: 'Martín Gómez',
    dniCuit: '20-31904512-8',
    email: 'martin.gomez@email.com',
    phone: '+54 9 11 6120-3340',
    propertyId: 'PROP-002',
    role: 'INQUILINO',
    status: 'ACTIVO',
    notes: 'Seguro de caución Finaer vigente.',
    version: 1
  },
  {
    id: 'CLI-003',
    fullName: 'Estudio Contable Norte SRL',
    dniCuit: '30-71589320-9',
    email: 'admin@estudionorte.com.ar',
    phone: '+54 9 11 4980-1122',
    propertyId: 'PROP-003',
    role: 'INQUILINO',
    status: 'ACTIVO',
    notes: 'Requiere factura C mensualmente.',
    version: 1
  }
];

const INITIAL_PROPERTIES: PropertyContract[] = [
  {
    id: 'PROP-001',
    unitName: 'Depto 2A — Palermo',
    address: 'Gorriti 4820, Piso 2 Depto A, CABA',
    clientId: 'CLI-001',
    tenantName: 'Lucía Fernández',
    initialAmount: 480000,
    indexType: 'IPC',
    frequencyMonths: 3,
    startDate: '2026-03-01',
    endDate: '2028-02-28',
    status: 'ACTIVO',
    version: 1
  },
  {
    id: 'PROP-002',
    unitName: 'Depto 2B — Palermo',
    address: 'Gorriti 4820, Piso 2 Depto B, CABA',
    clientId: 'CLI-002',
    tenantName: 'Martín Gómez',
    initialAmount: 450000,
    indexType: 'ICL',
    frequencyMonths: 6,
    startDate: '2026-05-01',
    endDate: '2028-04-30',
    status: 'ACTIVO',
    version: 1
  },
  {
    id: 'PROP-003',
    unitName: 'Local Comercial — Belgrano',
    address: 'Av. Cabildo 2150, Local 4, CABA',
    clientId: 'CLI-003',
    tenantName: 'Estudio Contable Norte SRL',
    initialAmount: 820000,
    indexType: 'IPC',
    frequencyMonths: 2,
    startDate: '2026-01-01',
    endDate: '2027-12-31',
    status: 'ACTIVO',
    version: 1
  }
];

const INITIAL_TAXES: TaxDocument[] = [
  {
    id: 'IMP-001',
    period: '2026-11',
    serviceName: 'Luz (Edenor)',
    provider: 'Edenor S.A.',
    totalAmount: 68400,
    splitMode: 'IGUAL',
    assignedPropertyIds: ['PROP-001', 'PROP-002'],
    customPercentages: { 'PROP-001': 50, 'PROP-002': 50 },
    fileName: '2026-11_Luz_Edenor_Palermo.pdf',
    mimeType: 'application/pdf',
    driveFileId: 'demo-drive-001',
    drivePreviewUrl: '',
    driveDownloadUrl: '',
    version: 1
  },
  {
    id: 'IMP-002',
    period: '2026-11',
    serviceName: 'Agua (AySA)',
    provider: 'AySA S.A.',
    totalAmount: 42000,
    splitMode: 'PORCENTAJE',
    assignedPropertyIds: ['PROP-001', 'PROP-002', 'PROP-003'],
    customPercentages: { 'PROP-001': 30, 'PROP-002': 30, 'PROP-003': 40 },
    fileName: '2026-11_Agua_AySA_Consolidado.pdf',
    mimeType: 'application/pdf',
    driveFileId: 'demo-drive-002',
    drivePreviewUrl: '',
    driveDownloadUrl: '',
    version: 1
  },
  {
    id: 'IMP-003',
    period: '2026-11',
    serviceName: 'Municipal / ABL (AGIP)',
    provider: 'AGIP GCBA',
    totalAmount: 35600,
    splitMode: 'UNICO',
    assignedPropertyIds: ['PROP-003'],
    customPercentages: { 'PROP-003': 100 },
    fileName: '2026-11_ABL_AGIP_Cabildo.pdf',
    mimeType: 'application/pdf',
    driveFileId: 'demo-drive-003',
    drivePreviewUrl: '',
    driveDownloadUrl: '',
    version: 1
  }
];

function formatARS(amount: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);
}

function getMonthsBetween(startDateStr: string, targetPeriod: string): string[] {
  const [sy, sm] = startDateStr.split('-').map(Number);
  const [ty, tm] = targetPeriod.split('-').map(Number);
  const periods: string[] = [];
  let y = sy;
  let m = sm;
  while (y < ty || (y === ty && m <= tm)) {
    periods.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return periods;
}

function calculateContractRent(
  contract: PropertyContract,
  targetPeriod: string,
  indices: EconomicIndex[]
) {
  const months = getMonthsBetween(contract.startDate, targetPeriod);
  const elapsed = Math.max(0, months.length - 1);
  const completedSteps = Math.floor(elapsed / contract.frequencyMonths);

  let currentRent = contract.initialAmount;
  const breakdown: { stepLabel: string; factorPct: number; newRent: number }[] = [
    { stepLabel: `Inicio (${contract.startDate.slice(0, 7)})`, factorPct: 0, newRent: contract.initialAmount }
  ];

  for (let s = 1; s <= completedSteps; s++) {
    const startIdx = (s - 1) * contract.frequencyMonths;
    const endIdx = s * contract.frequencyMonths;
    const stepMonths = months.slice(startIdx, endIdx);

    if (contract.indexType === 'IPC') {
      let factor = 1;
      stepMonths.forEach((p) => {
        const idxObj = indices.find((i) => i.period === p);
        const pct = idxObj ? idxObj.ipcMonthlyPct : 2.0;
        factor *= 1 + pct / 100;
      });
      currentRent = Math.round(currentRent * factor);
      breakdown.push({
        stepLabel: `Ajuste #${s} (${months[endIdx] || targetPeriod})`,
        factorPct: Number(((factor - 1) * 100).toFixed(2)),
        newRent: currentRent
      });
    } else {
      const pStart = months[startIdx];
      const pEnd = months[endIdx] || targetPeriod;
      const iclStart = indices.find((i) => i.period === pStart)?.iclValue || 22.0;
      const iclEnd = indices.find((i) => i.period === pEnd)?.iclValue || 26.94;
      const factor = iclEnd / iclStart;
      currentRent = Math.round(currentRent * factor);
      breakdown.push({
        stepLabel: `Ajuste ICL #${s} (${pEnd})`,
        factorPct: Number(((factor - 1) * 100).toFixed(2)),
        newRent: currentRent
      });
    }
  }

  // Proyección próximo mes
  const nextMonthIndex = elapsed + 1;
  const willAdjustNextMonth = nextMonthIndex > 0 && nextMonthIndex % contract.frequencyMonths === 0;
  const latestIpc = indices[indices.length - 1]?.ipcMonthlyPct || 2.1;
  const estimatedFactor = willAdjustNextMonth ? Math.pow(1 + latestIpc / 100, contract.frequencyMonths) : 1;
  const nextMonthRent = Math.round(currentRent * estimatedFactor);

  return {
    currentRent,
    nextMonthRent,
    willAdjustNextMonth,
    breakdown
  };
}

export default function App() {
  const [roleView, setRoleView] = useState<'PROPIETARIO' | 'INQUILINO'>('PROPIETARIO');
  const [activeTab, setActiveTab] = useState<'RESUMEN' | 'CLIENTES' | 'IMPUESTOS' | 'NUBE'>('RESUMEN');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-11');

  const [indices, setIndices] = useState<EconomicIndex[]>(() => {
    const saved = localStorage.getItem('rp_indices');
    return saved ? JSON.parse(saved) : INITIAL_INDICES;
  });

  const [clients, setClients] = useState<ClientRecord[]>(() => {
    const saved = localStorage.getItem('rp_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [properties, setProperties] = useState<PropertyContract[]>(() => {
    const saved = localStorage.getItem('rp_properties');
    return saved ? JSON.parse(saved) : INITIAL_PROPERTIES;
  });

  const [taxes, setTaxes] = useState<TaxDocument[]>(() => {
    const saved = localStorage.getItem('rp_taxes');
    return saved ? JSON.parse(saved) : INITIAL_TAXES;
  });

  const [cloudConfig, setCloudConfig] = useState<CloudConnectionConfig>(() => {
    const saved = localStorage.getItem('rp_cloud');
    return saved
      ? JSON.parse(saved)
      : {
          appsScriptUrl: '',
          driveFolderUrl: '',
          sheetUrl: '',
          isConnected: false,
          lastSyncAt: null
        };
  });

  const [selectedTenantPropId, setSelectedTenantPropId] = useState<string>('PROP-001');
  const [previewDoc, setPreviewDoc] = useState<TaxDocument | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState<string>('');
  const [copiedCbu, setCopiedCbu] = useState<boolean>(false);

  // Formularios
  const [newClient, setNewClient] = useState<Partial<ClientRecord>>({
    fullName: '',
    dniCuit: '',
    email: '',
    phone: '',
    propertyId: 'PROP-001',
    role: 'INQUILINO',
    status: 'ACTIVO',
    notes: ''
  });

  const [newTax, setNewTax] = useState<{
    serviceName: string;
    provider: string;
    totalAmount: string;
    splitMode: SplitMode;
    assignedPropertyIds: string[];
    file: File | null;
  }>({
    serviceName: 'Gas (Metrogas)',
    provider: 'Metrogas S.A.',
    totalAmount: '',
    splitMode: 'IGUAL',
    assignedPropertyIds: ['PROP-001', 'PROP-002'],
    file: null
  });

  useEffect(() => {
    localStorage.setItem('rp_indices', JSON.stringify(indices));
    localStorage.setItem('rp_clients', JSON.stringify(clients));
    localStorage.setItem('rp_properties', JSON.stringify(properties));
    localStorage.setItem('rp_taxes', JSON.stringify(taxes));
    localStorage.setItem('rp_cloud', JSON.stringify(cloudConfig));
  }, [indices, clients, properties, taxes, cloudConfig]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Cálculo de impuestos asignados a cada propiedad
  const getTaxShareForProperty = (tax: TaxDocument, propertyId: string): number => {
    if (tax.period !== selectedPeriod) return 0;
    if (!tax.assignedPropertyIds.includes(propertyId)) return 0;

    if (tax.splitMode === 'UNICO') {
      return tax.assignedPropertyIds[0] === propertyId ? tax.totalAmount : 0;
    }
    if (tax.splitMode === 'IGUAL') {
      return Math.round(tax.totalAmount / tax.assignedPropertyIds.length);
    }
    if (tax.splitMode === 'PORCENTAJE') {
      const pct = tax.customPercentages?.[propertyId] ?? 100 / tax.assignedPropertyIds.length;
      return Math.round((tax.totalAmount * pct) / 100);
    }
    return 0;
  };

  const liquidations = useMemo(() => {
    return properties.map((prop) => {
      const rentCalc = calculateContractRent(prop, selectedPeriod, indices);
      const propTaxes = taxes
        .filter((t) => t.period === selectedPeriod && t.assignedPropertyIds.includes(prop.id))
        .map((t) => ({
          ...t,
          shareAmount: getTaxShareForProperty(t, prop.id)
        }));
      const taxesTotal = propTaxes.reduce((acc, item) => acc + item.shareAmount, 0);
      return {
        property: prop,
        client: clients.find((c) => c.id === prop.clientId || c.propertyId === prop.id),
        rentCalc,
        propTaxes,
        taxesTotal,
        grandTotal: rentCalc.currentRent + taxesTotal,
        nextMonthEstimatedTotal: rentCalc.nextMonthRent + taxesTotal
      };
    });
  }, [properties, clients, taxes, indices, selectedPeriod]);

  // Guardar Cliente en tabla local y sincronizar con Google Sheets
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.fullName || !newClient.dniCuit) return;

    const record: ClientRecord = {
      id: `CLI-${String(clients.length + 1).padStart(3, '0')}`,
      fullName: newClient.fullName,
      dniCuit: newClient.dniCuit,
      email: newClient.email || '',
      phone: newClient.phone || '',
      propertyId: newClient.propertyId || '',
      role: (newClient.role as 'INQUILINO' | 'PROPIETARIO') || 'INQUILINO',
      status: 'ACTIVO',
      notes: newClient.notes || '',
      version: 1
    };

    setClients((prev) => [...prev, record]);
    setNewClient({ fullName: '', dniCuit: '', email: '', phone: '', propertyId: 'PROP-001', role: 'INQUILINO', status: 'ACTIVO', notes: '' });

    if (cloudConfig.appsScriptUrl) {
      setIsSyncing(true);
      try {
        await callAppsScriptPost(cloudConfig.appsScriptUrl, {
          action: 'upsertCliente',
          record
        });
        showToast('Cliente guardado en Google Sheets (Clientes_Inquilinos).');
      } catch (err) {
        showToast('Guardado local OK. Error al sincronizar con Google Sheets.');
      } finally {
        setIsSyncing(false);
      }
    } else {
      showToast('Cliente agregado a la tabla local (conecta Google Sheets en la pestaña Nube).');
    }
  };

  // Subir documento PDF/Imagen y enviarlo a Google Drive + Google Sheets
  const handleUploadTaxDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(newTax.totalAmount);
    if (!newTax.serviceName || !amountNum || newTax.assignedPropertyIds.length === 0) return;

    setIsSyncing(true);
    try {
      const localUrl = newTax.file ? URL.createObjectURL(newTax.file) : undefined;
      const base64Data = newTax.file ? await fileToBase64(newTax.file) : '';
      const pctMap: Record<string, number> = {};
      newTax.assignedPropertyIds.forEach((id) => {
        pctMap[id] = Number((100 / newTax.assignedPropertyIds.length).toFixed(2));
      });

      const docRecord: TaxDocument = {
        id: `IMP-${Date.now().toString().slice(-4)}`,
        period: selectedPeriod,
        serviceName: newTax.serviceName,
        provider: newTax.provider || newTax.serviceName,
        totalAmount: amountNum,
        splitMode: newTax.splitMode,
        assignedPropertyIds: newTax.assignedPropertyIds,
        customPercentages: pctMap,
        fileName: newTax.file ? newTax.file.name : `${selectedPeriod}_${newTax.serviceName}.pdf`,
        mimeType: newTax.file ? newTax.file.type : 'application/pdf',
        localObjectUrl: localUrl,
        version: 1
      };

      if (cloudConfig.appsScriptUrl) {
        const res = await callAppsScriptPost<TaxDocument>(cloudConfig.appsScriptUrl, {
          action: 'uploadTaxDocument',
          record: docRecord,
          fileBase64: base64Data,
          fileName: docRecord.fileName,
          mimeType: docRecord.mimeType
        });
        if (res.status === 'ok' && res.data) {
          docRecord.driveFileId = res.data.driveFileId;
          docRecord.drivePreviewUrl = res.data.drivePreviewUrl;
          docRecord.driveDownloadUrl = res.data.driveDownloadUrl;
          docRecord.driveFolderUrl = res.data.driveFolderUrl;
          showToast('Documento guardado en Google Drive y registrado en Google Sheets.');
        }
      } else {
        showToast('Comprobante cargado localmente. Configura Apps Script para subir directo a Google Drive.');
      }

      setTaxes((prev) => [docRecord, ...prev]);
      setNewTax({
        serviceName: 'Internet (Flow)',
        provider: 'Personal Flow',
        totalAmount: '',
        splitMode: 'IGUAL',
        assignedPropertyIds: ['PROP-001', 'PROP-002'],
        file: null
      });
    } catch (err) {
      showToast('Error al procesar el documento.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Probar e inicializar base de datos Google Sheets + Google Drive
  const handleTestAndInitCloud = async () => {
    if (!cloudConfig.appsScriptUrl) {
      showToast('Ingresá primero la URL del Web App de Google Apps Script.');
      return;
    }
    setIsSyncing(true);
    try {
      const res = await callAppsScriptPost(cloudConfig.appsScriptUrl, {
        action: 'setupDatabase'
      });
      if (res.status === 'ok') {
        const info = res.data as { driveFolderUrl?: string; sheetUrl?: string };
        setCloudConfig((prev) => ({
          ...prev,
          isConnected: true,
          driveFolderUrl: info?.driveFolderUrl || prev.driveFolderUrl,
          sheetUrl: info?.sheetUrl || prev.sheetUrl,
          lastSyncAt: new Date().toLocaleTimeString('es-AR')
        }));
        showToast('Conexión exitosa: Hojas de cálculo y carpeta de Google Drive listas.');
      } else {
        showToast(`Error: ${res.message}`);
      }
    } catch (err) {
      showToast('No se pudo conectar con Google Apps Script. Verificá permisos ("Cualquier usuario").');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSheets = async () => {
    if (!cloudConfig.appsScriptUrl) return;
    setIsSyncing(true);
    try {
      const res = await fetchAllCloudData(cloudConfig.appsScriptUrl);
      if (res.status === 'ok' && res.data) {
        if (res.data.clientes?.length) setClients(res.data.clientes);
        if (res.data.propiedades?.length) setProperties(res.data.propiedades);
        if (res.data.impuestos?.length) setTaxes(res.data.impuestos);
        if (res.data.indices?.length) setIndices(res.data.indices);
        setCloudConfig((prev) => ({
          ...prev,
          isConnected: true,
          driveFolderUrl: res.driveFolderUrl || prev.driveFolderUrl,
          sheetUrl: res.sheetUrl || prev.sheetUrl,
          lastSyncAt: new Date().toLocaleTimeString('es-AR')
        }));
        showToast('Tablas sincronizadas desde Google Sheets.');
      }
    } catch (err) {
      showToast('Error al sincronizar tablas desde la nube.');
    } finally {
      setIsSyncing(false);
    }
  };

  const latestIndex = indices[indices.length - 1];
  const prevIndex = indices[indices.length - 2] || latestIndex;
  const iclMonthlyVar = (((latestIndex.iclValue / prevIndex.iclValue) - 1) * 100).toFixed(2);

  const activeTenantLiq =
    liquidations.find((l) => l.property.id === selectedTenantPropId) || liquidations[0];

  const filteredClients = clients.filter(
    (c) =>
      c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.dniCuit.includes(clientSearch) ||
      c.email.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 md:pb-8">
      {/* Toast Notificación */}
      {toastMsg && (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Principal Multiplataforma */}
      <header className="bg-slate-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/20 border border-emerald-500/40 p-2 rounded-xl">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight">RentaPro AR</h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  APK + Drive + Sheets
                </span>
              </div>
              <p className="text-xs text-slate-400">Gestión Integral IPC · ICL · Impuestos &amp; Clientes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Indicador de Estado Nube */}
            <button
              onClick={() => {
                setRoleView('PROPIETARIO');
                setActiveTab('NUBE');
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                cloudConfig.isConnected
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cloudConfig.isConnected ? (
                <>
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Drive &amp; Sheets Conectado</span>
                </>
              ) : (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Conectar Google Drive</span>
                </>
              )}
            </button>

            {/* Switch Vista Propietario / Inquilino */}
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setRoleView('PROPIETARIO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  roleView === 'PROPIETARIO'
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Propietario
              </button>
              <button
                onClick={() => setRoleView('INQUILINO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  roleView === 'INQUILINO'
                    ? 'bg-sky-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Inquilino
              </button>
            </div>
          </div>
        </div>

        {/* Sub-navegación Propietario */}
        {roleView === 'PROPIETARIO' && (
          <div className="bg-slate-800/80 border-t border-slate-700/80">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto">
              <nav className="flex gap-1 py-1.5">
                {[
                  { id: 'RESUMEN', label: 'Liquidaciones & Índices', icon: TrendingUp },
                  { id: 'CLIENTES', label: `Clientes (${clients.length})`, icon: Users },
                  { id: 'IMPUESTOS', label: `Documentos Drive (${taxes.length})`, icon: FileText },
                  { id: 'NUBE', label: 'Google Drive / APK', icon: Database }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                        activeTab === tab.id
                          ? 'bg-slate-900 text-emerald-400 border border-slate-700'
                          : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="flex items-center gap-2 py-1.5 pl-4">
                <span className="text-xs text-slate-400 hidden sm:inline">Período:</span>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5"
                >
                  {indices.map((idx) => (
                    <option key={idx.period} value={idx.period}>
                      {idx.period}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 pt-6 space-y-6">
        {roleView === 'PROPIETARIO' ? (
          <>
            {/* KPIs IPC / ICL / Cartera */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>IPC Mensual (INDEC)</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                    {latestIndex.period}
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{latestIndex.ipcMonthlyPct}%</div>
                <p className="text-xs text-slate-500 mt-1">Actualizado en tiempo real</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>ICL Diario/Mensual (BCRA)</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold">
                    +{iclMonthlyVar}%
                  </span>
                </div>
                <div className="text-2xl font-bold text-slate-900">{latestIndex.iclValue.toFixed(2)}</div>
                <p className="text-xs text-slate-500 mt-1">Índice Contratos de Locación</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 mb-1">Total a Cobrar ({selectedPeriod})</div>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatARS(liquidations.reduce((acc, l) => acc + l.grandTotal, 0))}
                </div>
                <p className="text-xs text-slate-500 mt-1">Alquileres + Impuestos prorrateados</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500 mb-1">Proyección Próximo Mes</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {formatARS(liquidations.reduce((acc, l) => acc + l.nextMonthEstimatedTotal, 0))}
                </div>
                <p className="text-xs text-slate-500 mt-1">Estimado según próxima renovación</p>
              </div>
            </div>

            {/* PESTAÑA 1: LIQUIDACIONES Y CONTRATOS */}
            {activeTab === 'RESUMEN' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-bold text-base text-slate-900">
                      Liquidación Consolidada por Propiedad ({selectedPeriod})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Cálculo automático por IPC/ICL, frecuencia contractual e impuestos divididos
                    </p>
                  </div>
                  {cloudConfig.sheetUrl && (
                    <a
                      href={cloudConfig.sheetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Google Sheets</span>
                    </a>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                        <th className="py-3 px-4">Propiedad / Inquilino</th>
                        <th className="py-3 px-4">Contrato &amp; Vigencia</th>
                        <th className="py-3 px-4">Índice / Ajuste</th>
                        <th className="py-3 px-4 text-right">Alquiler Base</th>
                        <th className="py-3 px-4 text-right">Impuestos</th>
                        <th className="py-3 px-4 text-right">Total Mes</th>
                        <th className="py-3 px-4 text-right">Próx. Mes (Est.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {liquidations.map((liq) => (
                        <tr key={liq.property.id} className="hover:bg-slate-50/80">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{liq.property.unitName}</div>
                            <div className="text-xs text-slate-500">{liq.property.tenantName}</div>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600">
                            <div>Inicio: {liq.property.startDate}</div>
                            <div>Fin: {liq.property.endDate}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-800">
                              {liq.property.indexType} · Cada {liq.property.frequencyMonths}m
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium">
                            {formatARS(liq.rentCalc.currentRent)}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600">
                            {formatARS(liq.taxesTotal)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-emerald-700">
                            {formatARS(liq.grandTotal)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-medium text-indigo-600">
                            {formatARS(liq.nextMonthEstimatedTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* PESTAÑA 2: TABLA E INFORMACIÓN DE CLIENTES */}
            {activeTab === 'CLIENTES' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form
                  onSubmit={handleAddClient}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit"
                >
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <UserPlus className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900">Registrar Nuevo Cliente</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nombre Completo / Razón Social *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClient.fullName}
                      onChange={(e) => setNewClient({ ...newClient, fullName: e.target.value })}
                      placeholder="Ej: Carolina Méndez"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">DNI / CUIT *</label>
                      <input
                        type="text"
                        required
                        value={newClient.dniCuit}
                        onChange={(e) => setNewClient({ ...newClient, dniCuit: e.target.value })}
                        placeholder="27-35123456-9"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono / WhatsApp</label>
                      <input
                        type="text"
                        value={newClient.phone}
                        onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                        placeholder="+54 9 11 ..."
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      placeholder="cliente@email.com"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Propiedad Asignada</label>
                    <select
                      value={newClient.propertyId}
                      onChange={(e) => setNewClient({ ...newClient, propertyId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.unitName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Notas / Garantía</label>
                    <textarea
                      rows={2}
                      value={newClient.notes}
                      onChange={(e) => setNewClient({ ...newClient, notes: e.target.value })}
                      placeholder="Garantía propietaria, seguro de caución, observaciones..."
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Guardar en Tabla Clientes</span>
                  </button>
                </form>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">Base de Datos de Clientes e Inquilinos</h3>
                      <p className="text-xs text-slate-500">
                        Sincronizado con la hoja <code className="bg-slate-100 px-1 rounded">Clientes_Inquilinos</code>
                      </p>
                    </div>
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="Buscar por nombre o DNI..."
                        className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-xs uppercase border-b border-slate-200">
                          <th className="py-3 px-4">ID / Cliente</th>
                          <th className="py-3 px-4">DNI / CUIT</th>
                          <th className="py-3 px-4">Contacto</th>
                          <th className="py-3 px-4">Unidad</th>
                          <th className="py-3 px-4">Garantía / Notas</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredClients.map((c) => {
                          const prop = properties.find((p) => p.id === c.propertyId);
                          return (
                            <tr key={c.id} className="hover:bg-slate-50">
                              <td className="py-3 px-4">
                                <span className="text-[10px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                                  {c.id}
                                </span>
                                <div className="font-semibold text-slate-900 mt-0.5">{c.fullName}</div>
                              </td>
                              <td className="py-3 px-4 text-xs font-mono text-slate-700">{c.dniCuit}</td>
                              <td className="py-3 px-4 text-xs text-slate-600">
                                <div>{c.phone}</div>
                                <div className="text-slate-400">{c.email}</div>
                              </td>
                              <td className="py-3 px-4 text-xs font-medium text-emerald-700">
                                {prop ? prop.unitName : c.propertyId}
                              </td>
                              <td className="py-3 px-4 text-xs text-slate-500 max-w-xs">{c.notes}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 3: CARGA DE DOCUMENTOS A GOOGLE DRIVE Y PRORRATEO */}
            {activeTab === 'IMPUESTOS' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form
                  onSubmit={handleUploadTaxDocument}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit"
                >
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Upload className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900">Subir Boleta PDF a Google Drive</h3>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Servicio / Impuesto</label>
                    <select
                      value={newTax.serviceName}
                      onChange={(e) => setNewTax({ ...newTax, serviceName: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="Luz (Edenor / Edesur)">Luz (Edenor / Edesur)</option>
                      <option value="Gas (Metrogas / Naturgy)">Gas (Metrogas / Naturgy)</option>
                      <option value="Agua (AySA)">Agua (AySA)</option>
                      <option value="Municipal / ABL (AGIP / ARBA)">Municipal / ABL (AGIP / ARBA)</option>
                      <option value="Internet / Cable">Internet / Cable</option>
                      <option value="Expensas Ordinarias">Expensas Ordinarias</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Monto Total Boleta (ARS)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newTax.totalAmount}
                      onChange={(e) => setNewTax({ ...newTax, totalAmount: e.target.value })}
                      placeholder="Ej: 54000"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Modo de División</label>
                    <select
                      value={newTax.splitMode}
                      onChange={(e) => setNewTax({ ...newTax, splitMode: e.target.value as SplitMode })}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                    >
                      <option value="IGUAL">Partes Iguales entre seleccionados</option>
                      <option value="UNICO">100% a un solo inquilino</option>
                      <option value="PORCENTAJE">Porcentaje equitativo personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Inquilinos / Unidades que participan:
                    </label>
                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {properties.map((p) => {
                        const checked = newTax.assignedPropertyIds.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewTax({
                                    ...newTax,
                                    assignedPropertyIds: [...newTax.assignedPropertyIds, p.id]
                                  });
                                } else {
                                  setNewTax({
                                    ...newTax,
                                    assignedPropertyIds: newTax.assignedPropertyIds.filter((id) => id !== p.id)
                                  });
                                }
                              }}
                              className="rounded text-emerald-600"
                            />
                            <span className="font-medium text-slate-800">{p.unitName}</span>
                            <span className="text-slate-400">({p.tenantName})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Archivo PDF o Foto de Factura (Guardar en Drive)
                    </label>
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => setNewTax({ ...newTax, file: e.target.files?.[0] || null })}
                      className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSyncing}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
                  >
                    <Cloud className="w-4 h-4 text-emerald-400" />
                    <span>{isSyncing ? 'Subiendo a Google Drive...' : 'Guardar en Drive y Prorratear'}</span>
                  </button>
                </form>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Documentos Almacenados en Google Drive ({selectedPeriod})
                      </h3>
                      <p className="text-xs text-slate-500">
                        Carpeta automática <code className="bg-slate-100 px-1 rounded">RentaPro_AR_Documentos/{selectedPeriod}</code>
                      </p>
                    </div>
                    {cloudConfig.driveFolderUrl && (
                      <a
                        href={cloudConfig.driveFolderUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg hover:bg-sky-100"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Abrir Carpeta Drive</span>
                      </a>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100">
                    {taxes
                      .filter((t) => t.period === selectedPeriod)
                      .map((tax) => (
                        <div key={tax.id} className="p-4 flex flex-wrap items-center justify-between gap-4 hover:bg-slate-50">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-sm">{tax.serviceName}</span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-medium">
                                {tax.splitMode}
                              </span>
                              {tax.driveFileId && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                                  Drive OK
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              Archivo: <span className="font-mono">{tax.fileName}</span> · Total:{' '}
                              <strong className="text-slate-800">{formatARS(tax.totalAmount)}</strong>
                            </div>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {tax.assignedPropertyIds.map((pid) => {
                                const p = properties.find((item) => item.id === pid);
                                return (
                                  <span
                                    key={pid}
                                    className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                                  >
                                    {p?.unitName}: {formatARS(getTaxShareForProperty(tax, pid))}
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPreviewDoc(tax)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Vista Previa PDF</span>
                            </button>
                            <button
                              onClick={() => setTaxes((prev) => prev.filter((item) => item.id !== tax.id))}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* PESTAÑA 4: CONEXIÓN GOOGLE DRIVE, GOOGLE SHEETS Y EMPAQUETADO APK */}
            {activeTab === 'NUBE' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Database className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h3 className="font-bold text-slate-900">Conexión en Tiempo Real: Google Drive &amp; Sheets</h3>
                      <p className="text-xs text-slate-500">
                        Persistencia automática de PDFs en Drive y tablas relacionales en Google Sheets
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      URL del Web App de Google Apps Script (`.../exec`)
                    </label>
                    <input
                      type="url"
                      value={cloudConfig.appsScriptUrl}
                      onChange={(e) => setCloudConfig({ ...cloudConfig, appsScriptUrl: e.target.value })}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleTestAndInitCloud}
                      disabled={isSyncing}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Inicializar Hojas y Carpeta Drive</span>
                    </button>

                    <button
                      onClick={handlePullFromSheets}
                      disabled={isSyncing || !cloudConfig.appsScriptUrl}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50"
                    >
                      Sincronizar Datos Ahora
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-600">
                    <div className="font-bold text-slate-800">Tablas creadas automáticamente en Google Sheets:</div>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><code>Clientes_Inquilinos</code>: DNI/CUIT, teléfonos, emails, garantías y asignación.</li>
                      <li><code>Propiedades_Contratos</code>: Montos iniciales, IPC/ICL, frecuencia y vigencia.</li>
                      <li><code>Impuestos_Documentos</code>: Prorrateos + ID y URL directa de cada PDF en Drive.</li>
                      <li><code>Liquidaciones_Historial</code> &amp; <code>Auditoria_Logs</code>: Trazabilidad completa.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-6 h-6 text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-base">Compilación Nativa Android (.APK)</h3>
                      <p className="text-xs text-slate-400">
                        Empaquetado mediante Capacitor 6 + Gradle (Local o GitHub Actions)
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 font-mono text-xs text-emerald-300 space-y-1 overflow-x-auto">
                    <div># 1. Instalar dependencias y compilar frontend</div>
                    <div>npm install &amp;&amp; npm run build</div>
                    <div className="pt-2"># 2. Sincronizar proyecto Android Capacitor</div>
                    <div>npx cap add android &amp;&amp; npx cap sync android</div>
                    <div className="pt-2"># 3. Generar archivo .APK instalable</div>
                    <div>cd android &amp;&amp; ./gradlew assembleDebug</div>
                    <div className="text-slate-400 pt-1">
                      # Salida: android/app/build/outputs/apk/debug/app-debug.apk
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    El paquete descargable incluye el archivo <code>.github/workflows/build-android-apk.yml</code>: al
                    subir este proyecto a GitHub, la nube compila automáticamente el archivo <strong>.apk</strong> sin
                    necesidad de instalar Android Studio en tu computadora.
                  </p>
                </div>
              </div>
            )}
          </>
        ) : (
          /* VISTA DEL INQUILINO */
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase text-sky-600">Portal del Inquilino</span>
                <h2 className="text-lg font-bold text-slate-900">{activeTenantLiq.property.unitName}</h2>
                <p className="text-xs text-slate-500">
                  Titular: {activeTenantLiq.property.tenantName} · Contrato: {activeTenantLiq.property.startDate} al{' '}
                  {activeTenantLiq.property.endDate}
                </p>
              </div>

              <select
                value={selectedTenantPropId}
                onChange={(e) => setSelectedTenantPropId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl bg-slate-50"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.unitName} ({p.tenantName})
                  </option>
                ))}
              </select>
            </div>

            {/* Banner Vencimiento antes del 10 */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm text-amber-950">
                    Vencimiento de Pago: Antes del 10 de cada mes (10/{selectedPeriod.split('-')[1]}/{selectedPeriod.split('-')[0]})
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Alias de transferencia: <strong>RENTAPRO.ALQUILERES.AR</strong> · CBU: 0000003100089432110982
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText('RENTAPRO.ALQUILERES.AR');
                  setCopiedCbu(true);
                  setTimeout(() => setCopiedCbu(false), 2500);
                }}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedCbu ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCbu ? 'Alias Copiado' : 'Copiar Alias'}</span>
              </button>
            </div>

            {/* Resumen Total del Mes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm">
                <div className="text-xs text-slate-400">Total a Pagar ({selectedPeriod})</div>
                <div className="text-3xl font-bold text-emerald-400 mt-1">
                  {formatARS(activeTenantLiq.grandTotal)}
                </div>
                <div className="text-xs text-slate-300 mt-2">
                  Alquiler: {formatARS(activeTenantLiq.rentCalc.currentRent)} + Impuestos:{' '}
                  {formatARS(activeTenantLiq.taxesTotal)}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500">Alquiler Base Vigente</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {formatARS(activeTenantLiq.rentCalc.currentRent)}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Ajuste {activeTenantLiq.property.indexType} cada {activeTenantLiq.property.frequencyMonths} meses
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-xs text-slate-500">Impuestos y Servicios Prorrateados</div>
                <div className="text-2xl font-bold text-sky-600 mt-1">
                  {formatARS(activeTenantLiq.taxesTotal)}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  {activeTenantLiq.propTaxes.length} comprobantes respaldados en Drive
                </div>
              </div>
            </div>

            {/* Desglose del Alquiler e Impuestos con Vista Previa */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">
                  Historial y Evolución del Alquiler desde el Inicio
                </h3>
                <div className="space-y-2.5">
                  {activeTenantLiq.rentCalc.breakdown.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-800">{step.stepLabel}</div>
                        <div className="text-slate-500">
                          {step.factorPct > 0 ? `Variación acumulada: +${step.factorPct}%` : 'Valor inicial pactado'}
                        </div>
                      </div>
                      <div className="font-bold text-sm text-slate-900">{formatARS(step.newRent)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-900 mb-3">
                  Impuestos Asignados &amp; Boletas en Google Drive
                </h3>
                <div className="space-y-2.5">
                  {activeTenantLiq.propTaxes.map((tax) => (
                    <div
                      key={tax.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{tax.serviceName}</div>
                        <div className="text-slate-500">
                          Total boleta: {formatARS(tax.totalAmount)} ({tax.splitMode})
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-sky-700">{formatARS(tax.shareAmount)}</span>
                        <button
                          onClick={() => setPreviewDoc(tax)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver PDF</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL VISOR DE DOCUMENTOS (GOOGLE DRIVE / PDF LOCAL) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm">{previewDoc.serviceName} — {previewDoc.fileName}</h4>
                <p className="text-xs text-slate-400">
                  Monto total: {formatARS(previewDoc.totalAmount)} · Almacenado en Google Drive
                </p>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-100 h-[440px] flex flex-col items-center justify-center">
              {previewDoc.drivePreviewUrl ? (
                <iframe
                  src={previewDoc.drivePreviewUrl}
                  title={previewDoc.fileName}
                  className="w-full h-full rounded-xl border border-slate-300 bg-white"
                />
              ) : previewDoc.localObjectUrl ? (
                <iframe
                  src={previewDoc.localObjectUrl}
                  title={previewDoc.fileName}
                  className="w-full h-full rounded-xl border border-slate-300 bg-white"
                />
              ) : (
                <div className="bg-white p-8 rounded-2xl border border-slate-200 max-w-md w-full text-center space-y-3 shadow-sm">
                  <FileText className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h5 className="font-bold text-slate-900">Comprobante Digital Respaldado</h5>
                  <p className="text-xs text-slate-600">
                    Archivo: <strong>{previewDoc.fileName}</strong>
                    <br />
                    Proveedor: {previewDoc.provider} · Período: {previewDoc.period}
                    <br />
                    Importe Total: <strong>{formatARS(previewDoc.totalAmount)}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Al conectar Google Apps Script, este visor carga automáticamente el PDF real alojado en tu carpeta de Google Drive.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
