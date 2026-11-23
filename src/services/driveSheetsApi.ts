import { ClientRecord, PropertyContract, TaxDocument, EconomicIndex } from '../types/models';

export interface CloudSyncResponse<T = unknown> {
  status: 'ok' | 'error';
  data?: T;
  message?: string;
  driveFolderUrl?: string;
  sheetUrl?: string;
  duplicate?: boolean;
}

/**
 * Convierte un File del navegador / Android WebView a Base64 limpio
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Envía peticiones POST hacia Google Apps Script evitando problemas de CORS preflight
 * (text/plain es parseado en doPost(e) mediante JSON.parse(e.postData.contents)).
 */
export async function callAppsScriptPost<T = unknown>(
  appsScriptUrl: string,
  payload: Record<string, unknown>
): Promise<CloudSyncResponse<T>> {
  if (!appsScriptUrl) {
    return { status: 'error', message: 'URL de Google Apps Script no configurada.' };
  }

  const enrichedPayload = {
    ...payload,
    requestId: `REQ-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  };

  const response = await fetch(appsScriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(enrichedPayload)
  });

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} al conectar con Google Apps Script`);
  }

  return (await response.json()) as CloudSyncResponse<T>;
}

export async function fetchAllCloudData(appsScriptUrl: string): Promise<
  CloudSyncResponse<{
    clientes: ClientRecord[];
    propiedades: PropertyContract[];
    indices: EconomicIndex[];
    impuestos: TaxDocument[];
  }>
> {
  const url = `${appsScriptUrl}${appsScriptUrl.includes('?') ? '&' : '?'}action=getAllData`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status} al descargar tablas de Google Sheets`);
  }
  return await response.json();
}
