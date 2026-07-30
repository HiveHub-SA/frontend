import { ColmenaDTO } from "../colmenas/colmena.model";

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
