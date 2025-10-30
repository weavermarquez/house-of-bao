import fc from "fast-check";
import { angle, round, square, atom, type Form } from "../Form";

export type RawFormNode =
  | { kind: "atom"; label: string }
  | { kind: "round" | "square" | "angle"; children: RawFormNode[] };

export const rawFormArb: fc.Arbitrary<RawFormNode> = fc.letrec<RawFormNode>(
  (tie) => ({
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
  }),
).node;

export const invertiblePairArb = fc.record({
  outer: fc.constantFrom<"round" | "square">("round", "square"),
  payloads: fc.array(rawFormArb, { minLength: 0, maxLength: 3 }),
});

export function materializeRawForm(raw: RawFormNode): Form {
  switch (raw.kind) {
    case "atom":
      return atom(raw.label);
    case "round":
      return round(...raw.children.map(materializeRawForm));
    case "square":
      return square(...raw.children.map(materializeRawForm));
    case "angle":
      return angle(...raw.children.map(materializeRawForm));
    default: {
      const exhaustiveCheck: never = raw;
      return exhaustiveCheck;
    }
  }
}
