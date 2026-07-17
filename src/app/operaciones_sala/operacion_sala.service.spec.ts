import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OperacionSalaService, OperacionSalaRequest, OperacionSalaResponse, ResumenSalaResponse } from './operacion_sala.service';

describe('OperacionSalaService', () => {
  let service: OperacionSalaService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [OperacionSalaService]
    });
    service = TestBed.inject(OperacionSalaService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should send POST request to register an operation', () => {
    const mockRequest: OperacionSalaRequest = {
      fecha: '2026-07-10',
      tipoOperacion: 'INGRESO',
      cantidadAlzas: 10,
      regionId: 1,
      apiariosIds: []
    };

    const mockResponse: OperacionSalaResponse = {
      id: 1,
      fecha: '2026-07-10',
      tipoOperacion: 'INGRESO',
      cantidadAlzas: 10,
      temporada: '2026/2027',
      regionId: 1,
      regionNombre: 'Test Region',
      apiariosNombres: []
    };

    service.registrarOperacion(mockRequest).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8080/api/hivehub/sala-extraccion');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(mockRequest);
    req.flush(mockResponse);
  });

  it('should send GET request to fetch summary', () => {
    const regionId = 1;
    const temporada = '2026/2027';
    const mockSummary: ResumenSalaResponse = {
      totalMielExtraida: 120.5,
      alzasProcesadas: 4,
      alzasEnEspera: 6
    };

    service.obtenerResumen(regionId, temporada).subscribe(response => {
      expect(response).toEqual(mockSummary);
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/hivehub/sala-extraccion/resumen?regionId=${regionId}&temporada=${temporada}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockSummary);
  });

  it('should send GET request to fetch history', () => {
    const regionId = 1;
    const temporada = '2026/2027';
    const mockHistory: OperacionSalaResponse[] = [
      {
        id: 1,
        fecha: '2026-07-10',
        tipoOperacion: 'INGRESO',
        cantidadAlzas: 10,
        temporada: '2026/2027',
        regionId: 1,
        regionNombre: 'Test Region',
        apiariosNombres: []
      }
    ];

    service.obtenerHistorial(regionId, temporada).subscribe(response => {
      expect(response).toEqual(mockHistory);
    });

    const req = httpMock.expectOne(`http://localhost:8080/api/hivehub/sala-extraccion/historial?regionId=${regionId}&temporada=${temporada}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockHistory);
  });
});
