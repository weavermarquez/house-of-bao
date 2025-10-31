import { hydrateLevels } from "./loader";
import { rawLevels } from "./rawLevels";

export const levels = hydrateLevels(rawLevels);
