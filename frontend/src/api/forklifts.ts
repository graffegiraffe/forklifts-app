import type { Forklift, ForkliftCreatePayload, ForkliftUpdatePayload, ForkliftWithIncidents } from "../types";
import client from "./client";

export const forkliftApi = {
  list: (number?: string) =>
    client
      .get<Forklift[]>("/forklifts/", { params: number ? { number } : undefined })
      .then((r) => r.data),

  get: (id: number) =>
    client.get<ForkliftWithIncidents>(`/forklifts/${id}`).then((r) => r.data),

  create: (payload: ForkliftCreatePayload) =>
    client.post<Forklift>("/forklifts/", payload).then((r) => r.data),

  update: (id: number, payload: ForkliftUpdatePayload) =>
    client.put<Forklift>(`/forklifts/${id}`, payload).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/forklifts/${id}`),
};
