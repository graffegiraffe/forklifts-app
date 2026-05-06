import type { Incident, IncidentCreatePayload, IncidentUpdatePayload } from "../types";
import client from "./client";

export const incidentApi = {
  list: (forkliftId: number) =>
    client.get<Incident[]>(`/forklifts/${forkliftId}/incidents/`).then((r) => r.data),

  create: (forkliftId: number, payload: IncidentCreatePayload) =>
    client.post<Incident>(`/forklifts/${forkliftId}/incidents/`, payload).then((r) => r.data),

  update: (forkliftId: number, incidentId: number, payload: IncidentUpdatePayload) =>
    client
      .put<Incident>(`/forklifts/${forkliftId}/incidents/${incidentId}`, payload)
      .then((r) => r.data),

  delete: (forkliftId: number, incidentId: number) =>
    client.delete(`/forklifts/${forkliftId}/incidents/${incidentId}`),
};
