import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { collect, disperse } from "../arrangement";
import { canonicalSignature, round, square, atom } from "../Form";

describe("Arrangement Axiom", () => {
  describe("Property-based tests", () => {
    it("disperse and collect are inverses for simple frames", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), {
            minLength: 1,
            maxLength: 10,
          }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (contentLabels, contextLabel) => {
            const context = atom(contextLabel);
            const contents = contentLabels.map((label) => atom(label));
            const frame = round(context, square(...contents));

            const dispersed = disperse(frame);
            const collected = collect(dispersed);

            expect(collected).toHaveLength(1);
            expect(canonicalSignature(collected[0])).toBe(
              canonicalSignature(frame),
            );
          },
        ),
      );
    });

    it("collect and disperse are inverses for dispersed frames", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), {
            minLength: 2,
            maxLength: 10,
          }),
          fc.string({ minLength: 1, maxLength: 10 }),
          (contentLabels, contextLabel) => {
            const context = atom(contextLabel);
            const contents = contentLabels.map((label) => atom(label));
            const frame = round(context, square(...contents));
            const dispersed = disperse(frame);

            const recollected = collect(dispersed);
            const redispersed = disperse(recollected[0]);

            expect(redispersed.length).toBe(dispersed.length);
            const originalSignatures = new Set(
              dispersed.map(canonicalSignature),
            );
            const redispersedSignatures = new Set(
              redispersed.map(canonicalSignature),
            );
            expect(originalSignatures).toEqual(redispersedSignatures);
          },
        ),
      );
    });

    it("disperse handles empty squares correctly", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10 }),
          (contextLabel) => {
            const context = atom(contextLabel);
            const frame = round(context, square());

            const result = disperse(frame);
            expect(result).toEqual([]);
          },
        ),
      );
    });

    it("collect handles empty inputs and mismatched frames", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), {
            minLength: 0,
            maxLength: 5,
          }),
          fc.array(fc.string({ minLength: 1, maxLength: 10 }), {
            minLength: 0,
            maxLength: 5,
          }),
          fc.boolean(),
          (labels1, labels2, sameContext) => {
            const context1 = atom(sameContext ? "x" : "x");
            const context2 = atom(sameContext ? "x" : "y");
            const frame1 =
              labels1.length > 0
                ? round(context1, square(...labels1.map(atom)))
                : round(context1, square());
            const frame2 =
              labels2.length > 0
                ? round(context2, square(...labels2.map(atom)))
                : round(context2, square());

            const result = collect([frame1, frame2]);
            if (labels1.length === 0 || labels2.length === 0 || !sameContext) {
              // Mismatched contexts or empty, should return clones
              expect(result.length).toBe(2);
              expect(
                result.every((f) => f.id !== frame1.id && f.id !== frame2.id),
              ).toBe(true);
            }
          },
        ),
      );
    });
  });
});
