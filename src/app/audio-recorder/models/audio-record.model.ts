/**
 * Registro de audio persistido en IndexedDB.
 *
 * El blob se almacena SIEMPRE en formato WAV PCM 16-bit, mono, 16kHz.
 * Ese es el formato de entrada estándar que espera Vosk , así que la
 * conversión se hace una sola vez en el cliente, al guardar, y no
 * en cada intento de transcripción.
 *
 * Referencia formato Vosk: https://alphacephei.com/vosk/adaptation
 * (16-bit signed PCM, mono, 16000 Hz es el estandar de sus modelos).
 */
export interface AudioRecord {
  /** Autogenerado por IndexedDB (keyPath) */
  id?: number;

  /** Audio ya convertido a WAV PCM 16-bit mono 16kHz, listo para enviar al backend */
  blob: Blob;

  /** Nombre visible para el usuario (editable a futuro, por ahora autogenerado) */
  label: string;

  /** Fecha de creacion del registro */
  createdAt: Date;

  /** Duracion aproximada en segundos, calculada al grabar */
  durationSeconds: number;

  /** Sample rate real del audio almacenado (siempre 16000 en esta versión) */
  sampleRate: number;

  /** Tamaño del blob en bytes, para mostrar en UI y estimar cuota */
  sizeBytes: number;

  /** Estado del ciclo de vida de la transcripción */
  transcriptionStatus: AudioTranscriptionStatus;

  /** Texto transcripto, disponible solo cuando transcriptionStatus == 'done' */
  transcriptionText?: string;

  /** Mensaje de error, disponible solo cuando transcriptionStatus == 'error' */
  transcriptionError?: string;
}

export type AudioTranscriptionStatus = 'pending' | 'transcribing' | 'done' | 'error';
