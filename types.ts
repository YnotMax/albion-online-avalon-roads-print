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

export interface PendingValidation {
  connection: AlbionConnection;
  image: string;
}