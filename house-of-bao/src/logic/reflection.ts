import {
  type Form,
  deepClone,
  angle,
  canonicalSignature,
  noopForest,
} from "./Form";

type ReflectionPair = {
  baseIndex: number;
  reflectionIndex: number;
};

function firstChild(form: Form): Form | null {
  if (form.children.size !== 1) {
    return null;
  }

  const iterator = form.children.values().next();
  return iterator.done ? null : (iterator.value as Form);
}

function findReflectionPair(forms: Form[]): ReflectionPair | null {
  if (forms.length < 2) {
    return null;
  }

  const canonicalCache = forms.map((form) => canonicalSignature(form));
  const reflectionsBySignature = new Map<string, number[]>();

  forms.forEach((form, index) => {
    if (form.boundary !== "angle") {
      return;
    }

    const inner = firstChild(form);
    if (!inner) {
      return;
    }

    const innerSignature = canonicalSignature(inner);
    const existing = reflectionsBySignature.get(innerSignature);
    if (existing) {
      existing.push(index);
    } else {
      reflectionsBySignature.set(innerSignature, [index]);
    }
  });

  for (let baseIndex = 0; baseIndex < forms.length; baseIndex += 1) {
    const baseSignature = canonicalCache[baseIndex];
    const candidates = reflectionsBySignature.get(baseSignature);
    if (!candidates) {
      continue;
    }

    const reflectionIndex = candidates.find((index) => index !== baseIndex);
    if (reflectionIndex !== undefined) {
      return { baseIndex, reflectionIndex };
    }
  }

  return null;
}

function isVoidReflection(form: Form): boolean {
  return form.boundary === "angle" && form.children.size === 0;
}

export function isCancelApplicable(forms: Form[]): boolean {
  return findReflectionPair(forms) !== null || forms.some(isVoidReflection);
}

export function cancel(forms: Form[]): Form[] {
  const pair = findReflectionPair(forms);
  if (!pair) {
    const survivors = forms.filter((form) => !isVoidReflection(form));
    if (survivors.length === forms.length) {
      return noopForest(forms);
    }

    if (survivors.length === 0) {
      return [];
    }
    return noopForest(survivors);
  }

  const survivors = forms.filter((_, index) => {
    return index !== pair.baseIndex && index !== pair.reflectionIndex;
  });

  if (survivors.length === 0) {
    return [];
  }

  return noopForest(survivors);
}

export function create(...templates: Form[]): Form[] {
  if (templates.length === 0) {
    return [angle()];
  }

  const results: Form[] = [];
  templates.forEach((template) => {
    const baseClone = deepClone(template);
    results.push(baseClone);
    const reflectionClone = angle(deepClone(template));
    results.push(reflectionClone);
  });
  return results;
}
