import React, { useCallback, useEffect, useState } from "react";
import { incidentApi } from "../api/incidents";
import type { Forklift, Incident, IncidentCreatePayload, IncidentUpdatePayload } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";
import { IncidentModal } from "./IncidentModal";

interface Props {
  forklift: Forklift | null;
  onIncidentChanged: () => void;
}

const fmt = (dt: string) => {
  const d = new Date(dt);
  return (
    d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
};

export const IncidentTable: React.FC<Props> = ({ forklift, onIncidentChanged }) => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Incident | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    if (!forklift) { setIncidents([]); return; }
    setLoading(true);
    try {
      const data = await incidentApi.list(forklift.id);
      setIncidents(data);
    } catch {
      setErrorMsg("Ошибка загрузки простоев");
    } finally {
      setLoading(false);
    }
  }, [forklift]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const handleModalSubmit = async (payload: IncidentCreatePayload | IncidentUpdatePayload) => {
    if (!forklift) return;
    try {
      if (editingIncident) {
        await incidentApi.update(forklift.id, editingIncident.id, payload as IncidentUpdatePayload);
      } else {
        await incidentApi.create(forklift.id, payload as IncidentCreatePayload);
      }
      setModalOpen(false);
      await fetchIncidents();
      onIncidentChanged();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Ошибка сохранения";
      setErrorMsg(msg);
      throw err; // keep modal open
    }
  };

  const doDelete = async () => {
    if (!confirmDelete || !forklift) return;
    try {
      await incidentApi.delete(forklift.id, confirmDelete.id);
      await fetchIncidents();
      onIncidentChanged();
    } catch {
      setErrorMsg("Ошибка удаления");
    } finally {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="panel-inner">
      <div className="panel-subtitle">
        <span>Простои по погрузчику</span>
        {forklift && (
          <span className="panel-subtitle-num">
            {forklift.number}
          </span>
        )}
        <button
          className="btn btn-red"
          style={{ marginLeft: "auto" }}
          disabled={!forklift}
          onClick={() => { setEditingIncident(null); setModalOpen(true); }}
        >
          Добавить
        </button>
      </div>

      {errorMsg && (
        <div style={{ color: "#C41230", fontSize: 13, marginBottom: 8 }}>
          ⚠ {errorMsg}{" "}
          <button
            style={{ background: "none", border: "none", color: "#999", cursor: "pointer" }}
            onClick={() => setErrorMsg(null)}
          >×</button>
        </div>
      )}

      {!forklift ? (
        <p className="empty-hint">Выберите погрузчик в таблице слева</p>
      ) : loading ? (
        <p className="empty-hint">Загрузка...</p>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>Код записи</th>
                <th>Начало</th>
                <th>Окончание</th>
                <th style={{ width: 90 }}>Время простоя</th>
                <th>Причина</th>
                <th style={{ width: 56, textAlign: "center" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc) => (
                <tr key={inc.id}>
                  <td>{inc.id}</td>
                  <td>{fmt(inc.started_at)}</td>
                  <td>
                    {inc.ended_at ? (
                      fmt(inc.ended_at)
                    ) : (
                      <span className="tag-active">активен</span>
                    )}
                  </td>
                  <td>{inc.downtime_display}</td>
                  <td>{inc.description ?? "—"}</td>
                  <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                    <button
                      className="action-btn"
                      title="Изменить"
                      onClick={() => { setEditingIncident(inc); setModalOpen(true); }}
                    >✏</button>
                    <button
                      className="action-btn danger"
                      title="Удалить"
                      onClick={() => setConfirmDelete(inc)}
                    >✕</button>
                  </td>
                </tr>
              ))}
              {incidents.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#aaa", padding: 12 }}>
                    Нет зарегистрированных простоев
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <IncidentModal
        open={modalOpen}
        incident={editingIncident}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Удалить информацию о простое?"
        text="Вы уверены?"
        okText="Удалить"
        onOk={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};
