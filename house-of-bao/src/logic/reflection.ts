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
  reflectionChildIndex: number;
};

function findReflectionPair(forms: Form[]): ReflectionPair | null {
  if (forms.length < 2) {
    return null;
  }

  const canonicalCache = forms.map((form) => canonicalSignature(form));

  for (let angleIndex = forms.length - 1; angleIndex >= 0; angleIndex -= 1) {
    const candidate = forms[angleIndex];
    if (candidate.boundary !== "angle") {
      continue;
    }

    const children = [...candidate.children];
    for (let childIndex = 0; childIndex < children.length; childIndex += 1) {
      const childSignature = canonicalSignature(children[childIndex]);

      let baseIndex = -1;
      for (let idx = forms.length - 1; idx >= 0; idx -= 1) {
        if (idx === angleIndex) {
          continue;
        }
        if (canonicalCache[idx] === childSignature) {
          baseIndex = idx;
          break;
        }
      }

      if (baseIndex !== -1) {
        return {
          baseIndex,
          reflectionIndex: angleIndex,
          reflectionChildIndex: childIndex,
        };
      }
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

  const survivors: Form[] = [];
  forms.forEach((form, index) => {
    if (index === pair.baseIndex) {
      return;
    }

    if (index === pair.reflectionIndex) {
      const children = [...form.children];
      const remainingChildren = children.filter(
        (_, childIndex) => childIndex !== pair.reflectionChildIndex,
      );

      if (remainingChildren.length === 0) {
        return;
      }

      survivors.push({
        id: form.id,
        boundary: form.boundary,
        label: form.label,
        children: new Set<Form>(remainingChildren),
      });
      return;
    }

    survivors.push(form);
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
