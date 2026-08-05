/**
 * Conversión de audio a WAV PCM 16-bit mono a un sample rate objetivo (16kHz por defecto).
 *
 * Por que existe esto:
 * `MediaRecorder` graba en el formato nativo de cada navegador (webm/opus en
 * Chrome/Firefox/Android, mp4/aac en Safari/iOS). Esos formatos son buenos
 * para transporte y tamaño, pero Vosk espera PCM crudo sin comprimir.
 * En vez de resolver esto en el backend (que tendría que soportar N codecs
 * de entrada), normalizamos una sola vez en el cliente al guardar el audio,
 * asi el contrato con el backend es siempre el mismo sin importar de que
 * navegador/dispositivo vino la grabación.
 *
 * Proceso: decodificar el blob original con Web Audio API -> mezclar a mono
 * -> resamplear a 16kHz -> codificar como WAV con header de 44 bytes.
 */

const TARGET_SAMPLE_RATE = 16000;

export async function convertBlobToVoskWav(
  sourceBlob: Blob,
  targetSampleRate: number = TARGET_SAMPLE_RATE,
): Promise<Blob> {
  const arrayBuffer = await sourceBlob.arrayBuffer();

  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  const audioContext = new AudioContextCtor();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const monoSamples = mixToMono(audioBuffer);
    const resampledSamples = downsample(monoSamples, audioBuffer.sampleRate, targetSampleRate);
    const wavArrayBuffer = encodeAsWav(resampledSamples, targetSampleRate);

    return new Blob([wavArrayBuffer], { type: 'audio/wav' });
  } finally {
    // Liberar recursos del AudioContext apenas termina la conversión
    await audioContext.close();
  }
}

function mixToMono(audioBuffer: AudioBuffer): Float32Array {
  const channelCount = audioBuffer.numberOfChannels;
  const length = audioBuffer.length;
  const mixed = new Float32Array(length);

  for (let channel = 0; channel < channelCount; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      mixed[i] += channelData[i] / channelCount;
    }
  }

  return mixed;
}

function downsample(
  samples: Float32Array,
  originalSampleRate: number,
  targetSampleRate: number,
): Float32Array {
  if (targetSampleRate === originalSampleRate) {
    return samples;
  }
  if (targetSampleRate > originalSampleRate) {
    throw new Error(
      'No se soporta upsampling: el sample rate objetivo debe ser menor o igual al original.',
    );
  }

  const ratio = originalSampleRate / targetSampleRate;
  const newLength = Math.round(samples.length / ratio);
  const result = new Float32Array(newLength);

  let offsetResult = 0;
  let offsetSource = 0;

  while (offsetResult < newLength) {
    const nextOffsetSource = Math.round((offsetResult + 1) * ratio);
    let accumulator = 0;
    let count = 0;

    for (let i = offsetSource; i < nextOffsetSource && i < samples.length; i++) {
      accumulator += samples[i];
      count++;
    }

    result[offsetResult] = count > 0 ? accumulator / count : 0;
    offsetResult++;
    offsetSource = nextOffsetSource;
  }

  return result;
}

function encodeAsWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2; // 16-bit
  const blockAlign = bytesPerSample; // mono
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, 'WAVE');

  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // tamaño del sub-chunk fmt
  view.setUint16(20, 1, true); // PCM sin comprimir
  view.setUint16(22, 1, true); // 1 canal (mono)
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true); // bits por muestra

  writeAscii(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  floatSamplesToPcm16(view, 44, samples);

  return buffer;
}

function floatSamplesToPcm16(view: DataView, offset: number, samples: Float32Array): void {
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }
}

function writeAscii(view: DataView, offset: number, text: string): void {
  for (let i = 0; i < text.length; i++) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}
