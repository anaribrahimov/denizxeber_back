import { Priority } from "./priority.entity.js";

export enum PriorityEnum {
  Updating = 1,
  Updated = 2,
}

export const priorities: Priority[] = [
  { id: 1, name: 'Updating' } as Priority,
  { id: 2, name: 'Updated' } as Priority,
];
