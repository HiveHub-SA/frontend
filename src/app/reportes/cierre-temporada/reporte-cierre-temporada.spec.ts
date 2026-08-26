import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReporteCierreTemporadaComponent } from './reporte-cierre-temporada';
import { ReporteService } from '../reporte.service';
import { of } from 'rxjs';
import { ReporteCierreTemporadaDTO } from '../reporte.model';
import { provideRouter } from '@angular/router';

describe('ReporteCierreTemporadaComponent (US 11)', () => {
  let component: ReporteCierreTemporadaComponent;
  let fixture: ComponentFixture<ReporteCierreTemporadaComponent>;
  let reporteServiceMock: any;

  const mockReporte: ReporteCierreTemporadaDTO = {
    temporada: '2025/2026',
    fechaInicio: '2025-11-01',
    fechaFin: '2026-10-31',
    totalKilosMiel: 1200,
    totalAlzasProcesadas: 60,
    totalAlzasIngresadas: 80,
    totalAlzasEnEspera: 20,
    promedioKilosPorAlza: 20,
    promedioKilosPorColmena: 40,
    apiarioMasProductivo: 'Apiario El Roble',
    kilosApiarioMasProductivo: 800,
    rendimientoApiarios: [
      {
        apiarioId: 1,
        apiarioNombre: 'Apiario El Roble',
        kilosMiel: 800,
        alzasProcesadas: 40,
        kilosPorAlza: 20,
        totalColmenas: 20,
        kilosPorColmena: 40,
        porcentajeCosechaTotal: 66.7
      },
      {
        apiarioId: 2,
        apiarioNombre: 'Apiario Los Alamos',
        kilosMiel: 400,
        alzasProcesadas: 20,
        kilosPorAlza: 20,
        totalColmenas: 10,
        kilosPorColmena: 40,
        porcentajeCosechaTotal: 33.3
      }
    ],
    rendimientoFloraciones: [
      {
        floracion: 'Girasol',
        totalKilosEstimados: 800,
        cantidadApiarios: 1,
        porcentajeTotal: 66.7
      }
    ],
    eficienciaBiologica: {
      totalColmenasRevisadas: 30,
      totalColmenasProductivas: 25,
      totalColmenasConReinaSana: 28,
      totalColmenasHuerfanasOCeldaReal: 2,
      porcentajeColmenasProductivas: 83.3
    },
    tieneDatos: true
  };

  beforeEach(async () => {
    reporteServiceMock = {
      getReporteCierreTemporada: jasmine.createSpy('getReporteCierreTemporada').and.returnValue(of(mockReporte)),
      getTemporadasDisponibles: jasmine.createSpy('getTemporadasDisponibles').and.returnValue(of(['2025/2026', '2024/2025']))
    };

    await TestBed.configureTestingModule({
      imports: [ReporteCierreTemporadaComponent],
      providers: [
        { provide: ReporteService, useValue: reporteServiceMock },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReporteCierreTemporadaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe consultar el reporte al inicializar y cargar los datos', () => {
    expect(reporteServiceMock.getReporteCierreTemporada).toHaveBeenCalled();
    expect(component.reporte()).toEqual(mockReporte);
    expect(component.reporte()?.tieneDatos).toBeTrue();
  });

  it('debe alternar el ordenamiento del gráfico con el botón 1-clic', () => {
    component.cambiarModoOrden('ALFABETICO');
    expect(component.modoOrdenamiento()).toBe('ALFABETICO');

    component.cambiarModoOrden('RANKING');
    expect(component.modoOrdenamiento()).toBe('RANKING');
  });

  it('debe alternar la métrica visualizada en las barras con el botón 1-clic', () => {
    component.cambiarMetricaApiarios('ALZAS');
    expect(component.metricaGraficoApiarios()).toBe('ALZAS');

    component.cambiarMetricaApiarios('RINDE_COLMENA');
    expect(component.metricaGraficoApiarios()).toBe('RINDE_COLMENA');
  });

  it('debe cambiar de pestaña con los botones táctiles', () => {
    component.cambiarPestana('FLORACION');
    expect(component.pestanaActiva()).toBe('FLORACION');

    component.cambiarPestana('BIOLOGIA');
    expect(component.pestanaActiva()).toBe('BIOLOGIA');
  });
});
