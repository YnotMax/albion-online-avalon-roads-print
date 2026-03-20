import { NodeObject, LinkObject } from 'force-graph';
import { ZoneType } from './data/zoneNames';

export type { ZoneType };

export interface AlbionConnection {
  origem: string | null;
  destino: string | null;
  minutos_ate_fechar: number | null;
}

export interface CustomNode extends NodeObject {
  id: string;
  name: string;
  type: ZoneType;
}

export interface CustomLink extends LinkObject {
  source: string;
  target: string;
  expiration: number;
}

export interface GraphData {
  nodes: CustomNode[];
  links: CustomLink[];
}

export interface SavedMap {
  name: string;
  data: GraphData;
  lastModified: number;
}

export interface MapStorage {
  [name: string]: SavedMap;
}

export interface PendingValidation {
  connection: AlbionConnection;
  image: string;
}