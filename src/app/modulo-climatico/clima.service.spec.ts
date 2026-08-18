import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ClimaService, WeatherData } from './clima.service';

describe('ClimaService (Historia 07)', () => {
  let service: ClimaService;
  let httpMock: HttpTestingController;

  const mockLat = -32.41;
  const mockLng = -63.32;
  const cacheKey = `hivehub_weather_${mockLat.toFixed(4)}_${mockLng.toFixed(4)}`;

  const mockWeatherApiResponse = {
    current: { temp_c: 25, condition: { text: 'Soleado', code: 1000 }, humidity: 50, is_day: 1 },
    forecast: { forecastday: [{ hour: [
      { time_epoch: Math.floor(Date.now() / 1000) + 3600, time: '2026-08-18 10:00', temp_c: 26, condition: { code: 1000 }, chance_of_rain: 0 }
    ]}]}
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ClimaService]
    });
    service = TestBed.inject(ClimaService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Limpiamos el localStorage antes de cada prueba
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('El usuario consulta el clima con conexión a internet y el sistema almacena los datos en caché (pasa)', () => {
    spyOn(localStorage, 'setItem').and.callThrough();

    service.obtenerClimaApiario(mockLat, mockLng).subscribe(data => {
      expect(data).toBeTruthy();
      expect(data?.temp).toBe(25);
    });

    const req = httpMock.expectOne(request => request.url.includes('api.weatherapi.com'));
    expect(req.request.method).toBe('GET');
    req.flush(mockWeatherApiResponse);

    // Verificamos que se haya guardado en localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith(cacheKey, jasmine.any(String));
  });

  it('El usuario consulta el clima sin conexión a internet y muestra los datos en caché (pasa)', () => {
    // Simulamos datos previamente guardados
    const datosCacheados: WeatherData = {
      temp: 20, condicion: 'Nublado', humedad: 60, iconoCode: 1006, esDeDia: true, alertaLluvia: null, horas: []
    };
    localStorage.setItem(cacheKey, JSON.stringify(datosCacheados));
    
    // Forzamos el estado offline interceptando el getter de navigator.onLine
    spyOnProperty(navigator, 'onLine').and.returnValue(false);

    service.obtenerClimaApiario(mockLat, mockLng).subscribe(data => {
      expect(data).toBeTruthy();
      expect(data?.temp).toBe(20); // Debe recuperar los 20°C de la caché, no hacer petición
    });

    // Aseguramos que no se haya hecho ninguna petición HTTP
    httpMock.expectNone(request => request.url.includes('api.weatherapi.com'));
  });

  it('El usuario consulta el clima sin conexión a internet y no puede mostrar datos (falla)', () => {
    // No guardamos nada en caché y simulamos offline
    spyOnProperty(navigator, 'onLine').and.returnValue(false);

    service.obtenerClimaApiario(mockLat, mockLng).subscribe(data => {
      // Al fallar la caché por no existir, debe retornar null
      expect(data).toBeNull(); 
    });
    
    httpMock.expectNone(request => request.url.includes('api.weatherapi.com'));
  });
});