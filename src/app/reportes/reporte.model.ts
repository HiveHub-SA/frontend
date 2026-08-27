export interface PrioridadApiarioDTO {
  apiarioId: number;
  apiarioNombre: string;
  scorePrioridad: number;
  nivelPrioridad: 'ALTA' | 'MEDIA' | 'BAJA';
  motivoExplicativo: string;
}

export interface ComparativaInteranualDTO {
  deltaKilosMielPct?: number;
  deltaKilosPorAlzaPct?: number;
  deltaKilosPorColmenaPct?: number;
  kilosMielTemporadaPrevia?: number;
  temporadaPreviaLabel: string;
  sinDatosPrevios: boolean;
}

export interface RendimientoApiarioDTO {
  apiarioId: number;
  apiarioNombre: string;
  kilosMiel: number;
  alzasProcesadas: number;
  kilosPorAlza: number;
  totalColmenas: number;
  kilosPorColmena: number;
  porcentajeCosechaTotal: number;
  estadoValidacion: 'OK' | 'REVISAR' | 'INCOMPLETO';
  motivoValidacion: string;
  tipoAlzaPredominante?: string;
}

export interface RendimientoFloracionDTO {
  floracion: string;
  totalKilosEstimados: number;
  cantidadApiarios: number;
  porcentajeTotal: number;
  porcentajeReinasSanas: number;
  semaforoSaludReinas: 'VERDE' | 'AMARILLO' | 'ROJO';
}

export interface EficienciaBiologicaApiarioDTO {
  apiarioId: number;
  apiarioNombre: string;
  totalColmenasRevisadas: number;
  colmenasProductivas: number;
  porcentajeProductivas: number;
  reinasSanas: number;
  huerfanasOCeldaReal: number;
}

export interface EficienciaBiologicaDTO {
  totalColmenasRevisadas: number;
  totalColmenasProductivas: number;
  totalColmenasConReinaSana: number;
  totalColmenasHuerfanasOCeldaReal: number;
  porcentajeColmenasProductivas: number;
  desgloseApiarios?: EficienciaBiologicaApiarioDTO[];
}

export interface ReporteCierreTemporadaDTO {
  temporada: string;
  fechaInicio: string;
  fechaFin: string;
  totalKilosMiel: number;
  totalAlzasProcesadas: number;
  totalAlzasIngresadas: number;
  totalAlzasEnEspera: number;
  totalAlzasEnEsperaCriticas: number;
  umbralDiasCriticos: number;
  promedioKilosPorAlza: number;
  promedioKilosPorColmena: number;
  apiarioMasProductivo: string;
  kilosApiarioMasProductivo: number;
  estadoValidacionTopApiario: string;
  indicePrioridades: PrioridadApiarioDTO[];
  rendimientoApiarios: RendimientoApiarioDTO[];
  rendimientoFloraciones: RendimientoFloracionDTO[];
  eficienciaBiologica: EficienciaBiologicaDTO;
  comparativaInteranual?: ComparativaInteranualDTO;
  tieneDatos: boolean;
}
