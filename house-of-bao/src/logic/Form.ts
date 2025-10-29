export type BoundaryType = "round" | "square" | "angle" | "atom";

export interface Form {
  id: string;
  boundary: BoundaryType;
  children: Set<Form>;
}

export function createForm(
  boundary: BoundaryType,
  ...children: Form[]
): Form {
  return {
    id: crypto.randomUUID(),
    boundary,
    children: new Set(children), // Create a copy to avoid external mutations
  };
}

// Convenience functions for creating forms
export function variable(name: string): Form {
  return { ...createForm('atom'), id: name };
}

export function round(...children: Form[]): Form {
  return createForm('round', ...children);
}

export function square(...children: Form[]): Form {
  return createForm('square', ...children);
}

export function angle(...children: Form[]): Form {
  return createForm('angle', ...children);
}
