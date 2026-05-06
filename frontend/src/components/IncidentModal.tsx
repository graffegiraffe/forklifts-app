import React, { useEffect, useState } from "react";
import type { Incident, IncidentCreatePayload, IncidentUpdatePayload } from "../types";

interface Props {
  open: boolean;
  incident: Incident | null;
  onClose: () => void;
  onSubmit: (payload: IncidentCreatePayload | IncidentUpdatePayload) => Promise<void>;
}

const toLocalInput = (iso: string): string => {
  // Convert ISO string to "YYYY-MM-DDTHH:MM" for datetime-local input
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const nowLocal = () => toLocalInput(new Date().toISOString());

const fmtDisplay = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

export const IncidentModal: React.FC<Props> = ({ open, incident, onClose, onSubmit }) => {
  const [startedAt, setStartedAt] = useState("");
  const [endedAt, setEndedAt] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
      if (incident) {
        setStartedAt(toLocalInput(incident.started_at));
        setEndedAt(incident.ended_at ? toLocalInput(incident.ended_at) : "");
        setDescription(incident.description ?? "");
      } else {
        setStartedAt(nowLocal());
        setEndedAt("");
        setDescription("");
      }
    }
  }, [open, incident]);

  if (!open) return null;

  const handleOk = async () => {
    if (!startedAt) { setError("Дата начала обязательна"); return; }
    if (endedAt && new Date(endedAt) < new Date(startedAt)) {
      setError("Дата окончания не может быть раньше даты начала");
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        started_at: new Date(startedAt).toISOString(),
        ended_at: endedAt ? new Date(endedAt).toISOString() : null,
        description: description.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          Проблемы с погрузчиком? опишите
        </div>
        <div className="modal-body">
          <div className="form-row">
            <span className="form-label">начало</span>
            <input
              type="datetime-local"
              className="form-input"
              value={startedAt}
              onChange={(e) => { setStartedAt(e.target.value); setError(null); }}
            />
            <span className="form-label" style={{ textAlign: "right", minWidth: 70 }}>окончание</span>
            <input
              type="datetime-local"
              className="form-input"
              value={endedAt}
              onChange={(e) => { setEndedAt(e.target.value); setError(null); }}
            />
          </div>

          {/* Display formatted values as in the mockup */}
          <div style={{ display: "flex", gap: 12, marginBottom: 10, fontSize: 12, color: "#888" }}>
            {startedAt && <span>{fmtDisplay(startedAt)}</span>}
            {endedAt && <><span style={{ marginLeft: 68 }}>{fmtDisplay(endedAt)}</span></>}
          </div>

          <div style={{ fontWeight: 500, marginBottom: 6, fontSize: 13 }}>описание инцидента</div>
          <textarea
            className="form-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{ width: "100%" }}
          />

          {error && (
            <div style={{ color: "#C41230", fontSize: 12, marginTop: 6 }}>{error}</div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-red" style={{ minWidth: 100 }} onClick={handleOk} disabled={saving}>
            Сохранить
          </button>
          <button className="btn btn-gray" style={{ minWidth: 100 }} onClick={onClose}>
            Выход
          </button>
        </div>
      </div>
    </div>
  );
};
