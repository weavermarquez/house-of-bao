import { type BoundaryType, type Form } from "../logic";

export type AxiomType = "inversion" | "arrangement" | "reflection";

export type RawFormNode = {
  boundary: BoundaryType;
  label?: string;
  children?: RawFormNode[];
};

export type RawLevelDefinition = {
  id: string;
  name: string;
  description?: string;
  start: RawFormNode[];
  goal: RawFormNode[];
  maxMoves?: number;
  allowedAxioms?: AxiomType[];
  difficulty: 1 | 2 | 3 | 4 | 5;
};

export type LevelDefinition = {
  id: string;
  name: string;
  description?: string;
  start: Form[];
  goal: Form[];
  maxMoves?: number;
  allowedAxioms?: AxiomType[];
  difficulty: 1 | 2 | 3 | 4 | 5;
};
