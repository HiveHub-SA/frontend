// acá solo se usa colmenas.length para contar colmenas.
export interface ColmenaDTO {
  id: number;
  name: string;
  createdAt: string;
  apiarioId: number;
  camaras?: number;
  alzas?: number;
  nucleos?: number;
}

export interface ApiarioDTO {
  id: number;
  name: string;
  createdAt: string;
  latitude: number;
  longitude: number;
  colmenas: ColmenaDTO[];
}

export interface ApiarioVista {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export interface NewApiario {
  name: string;
  latitude: number | null;
  longitude: number | null;
}
