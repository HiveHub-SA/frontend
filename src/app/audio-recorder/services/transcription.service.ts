import { Injectable } from '@angular/core';

export interface TranscriptionResponse {
  transcription: string;
}

//Interfaz para el autocompletado
export interface FormularioIA{
  estadoReina?: 'VISTA_Y_SANA' | 'NO_VISTA' | 'CELDA_REAL' | 'AUSENTE' | null;
  nivelAlimento?: 'BAJO' | 'MEDIO' | 'ALTO' | null;
  produjoMiel?: boolean | null;
  observaciones?: string | null;
}

/**
 * Contrato HTTP propuesto para el endpoint de transcripcion. Se documenta aca
 * para que el frontend no necesite refactor cuando el backend exista:
 *
 *   POST /api/transcriptions
 *   Content-Type: multipart/form-data
 *
 *   Campos del form-data:
 *     - audio        (File)   Blob WAV, PCM 16-bit, mono, 16000 Hz
 *     - sampleRate   (string) "16000"
 *     - encoding     (string) "pcm_s16le"
 *
 *   Respuesta 200 esperada:
 *     { "transcription": "texto transcripto..." }
 *
 *   Respuesta de error (4xx/5xx):
 *     { "error": "mensaje descriptivo" }
 */
@Injectable({ providedIn: 'root' })
export class TranscriptionService {
  private readonly API_URL = 'http://localhost:8080/hivehub/transcriptions';


  async transcribeAudio(audioBlob: Blob, filename = 'audio.wav'): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, filename);
    formData.append('sampleRate', '16000');
    formData.append('encoding', 'pcm_s16le');

    const response = await fetch(this.API_URL, { method: 'POST', body: formData });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? `Error al transcribir (HTTP ${response.status})`);
    }

    return response.json();

    }

  //Metodo para completar json que ayudara a rellenar el formulario
  async completarFormulario(texto: string): Promise<FormularioIA> {
    const response = await fetch(`${this.API_URL}/complete-form`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? `Error al completar formulario (HTTP ${response.status})`);
    }
    return response.json();
  }

  }
