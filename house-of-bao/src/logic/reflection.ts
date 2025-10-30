import {
  type Form,
  deepClone,
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

  for (let reflectionIndex = 0; reflectionIndex < forms.length; reflectionIndex += 1) {
    const candidateReflection = forms[reflectionIndex];
    if (candidateReflection.boundary !== "angle") {
      continue;
    }

    const inner = firstChild(candidateReflection);
    if (!inner) {
      continue;
    }

    const innerSignature = canonicalSignature(inner);

    for (let baseIndex = 0; baseIndex < forms.length; baseIndex += 1) {
      if (baseIndex === reflectionIndex) {
        continue;
      }

      if (canonicalCache[baseIndex] === innerSignature) {
        return { baseIndex, reflectionIndex };
      }
    }
  }

  return null;
}

export function isReflectionApplicable(forms: Form[]): boolean {
  return findReflectionPair(forms) !== null;
}

export function cancelReflection(forms: Form[]): Form[] {
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

export function createReflection(form: Form): Form {
  return {
    id: crypto.randomUUID(),
    boundary: "angle",
    children: new Set<Form>([deepClone(form)]),
  };
}

export function createReflectionPair(form: Form): Form[] {
  const baseClone = deepClone(form);
  const reflectionClone = createReflection(form);
  return [baseClone, reflectionClone];
}
