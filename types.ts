
import { NodeObject, LinkObject } from 'force-graph';

export interface AlbionConnection {
  origem: string | null;
  destino: string | null;
  minutos_ate_fechar: number | null;
}

export interface CustomNode extends NodeObject {
  id: string;
  name: string;
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
