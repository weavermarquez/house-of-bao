import { createForm } from "../logic/Form";
import { type Form } from "../logic";
import {
  type LevelDefinition,
  type RawFormNode,
  type RawLevelDefinition,
} from "./types";

function instantiateForm(node: RawFormNode): Form {
  const children = node.children?.map(instantiateForm) ?? [];
  return createForm(node.boundary, ...children);
}

export function hydrateLevel(raw: RawLevelDefinition): LevelDefinition {
  return {
    ...raw,
    start: raw.start.map(instantiateForm),
    goal: raw.goal.map(instantiateForm),
  };
}

export function hydrateLevels(rawLevels: RawLevelDefinition[]): LevelDefinition[] {
  return rawLevels.map(hydrateLevel);
}
