// acá solo se usa colmenas.length para contar colmenas.
export interface ColmenaDTO {
  [key: string]: unknown;
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
}
