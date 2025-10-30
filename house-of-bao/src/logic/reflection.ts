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

export function isCancelApplicable(forms: Form[]): boolean {
  return findReflectionPair(forms) !== null;
}

export function cancel(forms: Form[]): Form[] {
  const pair = findReflectionPair(forms);
  if (!pair) {
    return noopForest(forms);
  }

  const survivors = forms.filter((_, index) => {
    return index !== pair.baseIndex && index !== pair.reflectionIndex;
  });

  if (survivors.length === 0) {
    return [];
  }

  return noopForest(survivors);
}

export function create(template: Form): Form[] {
  const baseClone = deepClone(template);
  const reflectionChild = deepClone(template);
  const reflectionClone = angle(reflectionChild);
  return [baseClone, reflectionClone];
}
