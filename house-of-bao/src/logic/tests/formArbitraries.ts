import fc from "fast-check";
import { angle, round, square, atom, type Form } from "../Form";

export type RawFormNode =
  | { kind: "atom"; label: string }
  | { kind: "round" | "square" | "angle"; children: RawFormNode[] };

const rawLetrec = fc.letrec<RawFormNode>((tie: any) => ({
  node: fc.oneof(
    fc.record({
      kind: fc.constant("atom"),
      label: fc.string({ minLength: 1, maxLength: 4 }),
    }),
    fc.record({
      kind: fc.constantFrom("round", "square", "angle"),
      children: fc.array(tie("node"), { minLength: 0, maxLength: 3 }),
    }),
  ),
}));

const structuralLetrec = fc.letrec<RawFormNode>((tie: any) => ({
  node: fc.record({
    kind: fc.constantFrom("round", "square", "angle"),
    children: fc.array(tie("node"), { minLength: 0, maxLength: 3 }),
  }),
}));

export const formNodeArb: fc.Arbitrary<RawFormNode> = rawLetrec.node;
export const structuralFormNodeArb: fc.Arbitrary<RawFormNode> =
  structuralLetrec.node;

export type InvertiblePairNodes = {
  outer: "round" | "square";
  payloads: RawFormNode[];
};

export const invertiblePairNodesArb: fc.Arbitrary<InvertiblePairNodes> =
  fc.record({
    outer: fc.constantFrom<"round" | "square">("round", "square"),
    payloads: fc.array(formNodeArb, { minLength: 0, maxLength: 3 }),
  });

export function materializeFormNode(raw: RawFormNode): Form {
  switch (raw.kind) {
    case "atom":
      return atom(raw.label);
    case "round":
      return round(...raw.children.map(materializeFormNode));
    case "square":
      return square(...raw.children.map(materializeFormNode));
    case "angle":
      return angle(...raw.children.map(materializeFormNode));
    default: {
      const exhaustiveCheck: never = raw;
      return exhaustiveCheck;
    }
  }
}

function materializeFormNodes(nodes: RawFormNode[]): Form[] {
  return nodes.map((node) => materializeFormNode(node));
}

export type FrameNodes = {
  context: RawFormNode[];
  payload: RawFormNode[];
};

export const frameNodesArb: fc.Arbitrary<FrameNodes> = fc.record({
  context: fc.array(formNodeArb, { minLength: 0, maxLength: 2 }),
  payload: fc.array(formNodeArb, { minLength: 1, maxLength: 3 }),
});

export const frameFormArb: fc.Arbitrary<Form> = frameNodesArb.map(
  ({ context, payload }) => {
    const contextForms = materializeFormNodes(context);
    const payloadForms = materializeFormNodes(payload);
    return round(...contextForms, square(...payloadForms));
  },
);

export const reflectiveFormArb: fc.Arbitrary<Form> = structuralFormNodeArb.map(
  (raw: RawFormNode) => {
    const base = materializeFormNode(raw);
    const reflected = angle(materializeFormNode(raw));
    return round(base, reflected);
  },
);
