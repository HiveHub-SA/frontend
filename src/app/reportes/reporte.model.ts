export interface RendimientoApiarioDTO {
  apiarioId: number;
  apiarioNombre: string;
  kilosMiel: number;
  alzasProcesadas: number;
  kilosPorAlza: number;
  totalColmenas: number;
  kilosPorColmena: number;
  porcentajeCosechaTotal: number;
}

export interface RendimientoFloracionDTO {
  floracion: string;
  totalKilosEstimados: number;
  cantidadApiarios: number;
  porcentajeTotal: number;
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
  promedioKilosPorAlza: number;
  promedioKilosPorColmena: number;
  apiarioMasProductivo: string;
  kilosApiarioMasProductivo: number;
  rendimientoApiarios: RendimientoApiarioDTO[];
  rendimientoFloraciones: RendimientoFloracionDTO[];
  eficienciaBiologica: EficienciaBiologicaDTO;
  tieneDatos: boolean;
}
