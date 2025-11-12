import { canonicalSignature, type Form } from "../logic/Form";
import { type RawFormNode } from "./types";

function toRawFormNode(form: Form): RawFormNode {
  const children = [...form.children];
  children.sort((left, right) =>
    canonicalSignature(left).localeCompare(canonicalSignature(right)),
  );

  const rawChildren = children.map(toRawFormNode);
  const node: RawFormNode = {
    boundary: form.boundary,
  };

  if (rawChildren.length > 0) {
    node.children = rawChildren;
  } else {
    node.children = [];
  }

  if (form.label !== undefined) {
    node.label = form.label;
  }

  return node;
}

export function serializeForms(forms: Form[]): RawFormNode[] {
  const sorted = [...forms];
  sorted.sort((left, right) =>
    canonicalSignature(left).localeCompare(canonicalSignature(right)),
  );
  return sorted.map(toRawFormNode);
}

export function formatFormsAsJson(forms: Form[]): string {
  return JSON.stringify(serializeForms(forms), null, 2);
}
