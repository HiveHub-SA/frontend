import { Injectable } from '@angular/core';

export interface TranscriptionResponse {
  transcription: string;
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
 *
 * Este endpoint todavía NO existe en el backend. Mientras tanto,
 * `transcribeAudio()` lanza un error controlado y explícito para que la UI
 * pueda mostrar un mensaje claro en vez de un fallo de red genérico.
 * Cuando el backend esté disponible, alcanza con:
 *   1. Definir la URL real en `API_URL`.
 *   2. Borrar el bloque "BACKEND NO DISPONIBLE" de abajo.
 */
@Injectable({ providedIn: 'root' })
export class TranscriptionService {
  private readonly API_URL = '/api/transcriptions';

  /** Cambiar a `false` en cuanto el endpoint real esté desplegado. */
  private readonly BACKEND_NOT_READY = true;

  async transcribeAudio(audioBlob: Blob, filename = 'audio.wav'): Promise<TranscriptionResponse> {
    if (this.BACKEND_NOT_READY) {
      // Simula latencia de red para que la UI de carga sea validable en el prototipo.
      await new Promise((resolve) => setTimeout(resolve, 800));
      throw new Error(
        'El backend de transcripción todavía no está disponible. ' +
          'Este botón ya está listo para conectarse en cuanto exista el endpoint.',
      );
    }

    const formData = new FormData();
    formData.append('audio', audioBlob, filename);
    formData.append('sampleRate', '16000');
    formData.append('encoding', 'pcm_s16le');

    const response = await fetch(this.API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? `Error al transcribir (HTTP ${response.status})`);
    }

    return response.json();
  }
}
