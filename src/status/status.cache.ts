import { Status } from "./status.entity.js";

export enum StatusEnum {
  Published = 1,
  Draft = 2,
}

export const statuses: Status[] = [
  { id: 1, name: 'Published' } as Status,
  { id: 2, name: 'Draft' } as Status,
];
