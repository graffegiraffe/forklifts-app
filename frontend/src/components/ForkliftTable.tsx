import React, { useCallback, useEffect, useRef, useState } from "react";
import { forkliftApi } from "../api/forklifts";
import type { Forklift } from "../types";
import { ConfirmDialog } from "./ConfirmDialog";

interface Props {
  currentUser: string;
  selectedId: number | null;
  onSelect: (forklift: Forklift | null) => void;
  onDataChanged: () => void;
  refreshKey: number;
}

interface EditState {
  id: number; // -1 = new row
  brand: string;
  number: string;
  load_capacity: string;
  is_active: boolean;
  errors: Partial<Record<"brand" | "number" | "load_capacity", string>>;
}

const NEW_ID = -1;
const fmt = (dt: string) => {
  const d = new Date(dt);
  return (
    d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  );
};

export const ForkliftTable: React.FC<Props> = ({
  currentUser,
  selectedId,
  onSelect,
  onDataChanged,
  refreshKey,
}) => {
  const [forklifts, setForklifts] = useState<Forklift[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchNum, setSearchNum] = useState("");
  const [edit, setEdit] = useState<EditState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<Forklift | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const brandRef = useRef<HTMLInputElement>(null);

  const fetchForklifts = useCallback(async (num?: string) => {
    setLoading(true);
    try {
      const data = await forkliftApi.list(num);
      setForklifts(data);
    } catch {
      setErrorMsg("Ошибка загрузки справочника");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchForklifts(searchNum || undefined);
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (edit) setTimeout(() => brandRef.current?.focus(), 50);
  }, [edit?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = () => fetchForklifts(searchNum || undefined);
  const handleReset = () => {
    setSearchNum("");
    fetchForklifts();
  };

  const startAdd = () => {
    if (edit) return;
    setEdit({ id: NEW_ID, brand: "", number: "", load_capacity: "", is_active: true, errors: {} });
    onSelect(null);
  };

  const startEdit = (f: Forklift) => {
    if (edit) return;
    setEdit({
      id: f.id,
      brand: f.brand,
      number: f.number,
      load_capacity: String(f.load_capacity),
      is_active: f.is_active,
      errors: {},
    });
  };

  const validate = (e: EditState): boolean => {
    const errors: EditState["errors"] = {};
    if (!e.brand.trim()) errors.brand = "Обязательное поле";
    if (!e.number.trim()) errors.number = "Обязательное поле";
    const cap = parseFloat(e.load_capacity);
    if (!e.load_capacity || isNaN(cap) || cap <= 0) errors.load_capacity = "Введите число > 0";
    setEdit((prev) => (prev ? { ...prev, errors } : null));
    return Object.keys(errors).length === 0;
  };

  const saveEdit = async () => {
    if (!edit) return;
    if (!validate(edit)) return;

    try {
      const cap = parseFloat(parseFloat(edit.load_capacity).toFixed(3));
      if (edit.id === NEW_ID) {
        await forkliftApi.create({
          brand: edit.brand.trim(),
          number: edit.number.trim(),
          load_capacity: cap,
          is_active: edit.is_active,
          modified_by: currentUser,
        });
      } else {
        await forkliftApi.update(edit.id, {
          brand: edit.brand.trim(),
          number: edit.number.trim(),
          load_capacity: cap,
          is_active: edit.is_active,
          modified_by: currentUser,
        });
      }
      setEdit(null);
      await fetchForklifts(searchNum || undefined);
      onDataChanged();
    } catch {
      setErrorMsg("Ошибка сохранения");
    }
  };

  const askCancel = () => setConfirmCancel(true);
  const doCancel = () => {
    setEdit(null);
    setConfirmCancel(false);
  };

  const askDelete = (f: Forklift) => {
    if (edit) return;
    setConfirmDelete(f);
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await forkliftApi.delete(confirmDelete.id);
      if (selectedId === confirmDelete.id) onSelect(null);
      await fetchForklifts(searchNum || undefined);
      onDataChanged();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Удаление запрещено: есть зарегистрированные простои";
      setErrorMsg(msg);
    } finally {
      setConfirmDelete(null);
    }
  };

  const rows: (Forklift | "new")[] = edit?.id === NEW_ID ? ["new", ...forklifts] : forklifts;

  return (
    <div className="panel-inner">
      <h2 className="page-title">Справочник погрузчиков</h2>

      {/* Search bar */}
      <div className="search-bar">
        <span style={{ fontSize: 13, color: "#555" }}>Номер погрузчика</span>
        <input
          className="search-input"
          value={searchNum}
          onChange={(e) => setSearchNum(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder=""
        />
        <button className="btn btn-red" onClick={handleSearch}>
          🔍 Искать
        </button>
        <button className="btn-link" onClick={handleReset}>
          × Сбросить фильтр
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
        <button className="btn btn-red" onClick={startAdd} disabled={!!edit}>
          Добавить
        </button>
        <button className="btn btn-red" disabled={!edit} onClick={saveEdit}>
          Сохранить
        </button>
        <button className="btn btn-gray" disabled={!edit} onClick={askCancel}>
          Отменить
        </button>
      </div>

      {errorMsg && (
        <div style={{ color: "#C41230", fontSize: 13, marginBottom: 8 }}>
          ⚠ {errorMsg}{" "}
          <button className="btn-link" onClick={() => setErrorMsg(null)} style={{ color: "#999" }}>
            ×
          </button>
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        {loading ? (
          <div style={{ padding: 16, color: "#999" }}>Загрузка...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 60 }}>Код записи</th>
                <th>Марка</th>
                <th>Номер</th>
                <th style={{ width: 120 }}>Грузоподъём-<br />ность</th>
                <th style={{ width: 70, textAlign: "center" }}>Активен</th>
                <th style={{ width: 130 }}>Время и Дата<br />изменения</th>
                <th style={{ width: 120 }}>Пользователь</th>
                <th style={{ width: 60, textAlign: "center" }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                if (row === "new") {
                  return (
                    <tr key="new" className="row-editing">
                      <td style={{ color: "#aaa" }}>—</td>
                      <td>
                        <input
                          ref={brandRef}
                          className={`cell-input${edit?.errors.brand ? " error" : ""}`}
                          value={edit?.brand ?? ""}
                          onChange={(e) => setEdit((p) => p && { ...p, brand: e.target.value, errors: { ...p.errors, brand: undefined } })}
                        />
                      </td>
                      <td>
                        <input
                          className={`cell-input${edit?.errors.number ? " error" : ""}`}
                          value={edit?.number ?? ""}
                          onChange={(e) => setEdit((p) => p && { ...p, number: e.target.value, errors: { ...p.errors, number: undefined } })}
                        />
                      </td>
                      <td>
                        <input
                          className={`cell-input${edit?.errors.load_capacity ? " error" : ""}`}
                          value={edit?.load_capacity ?? ""}
                          onChange={(e) => setEdit((p) => p && { ...p, load_capacity: e.target.value, errors: { ...p.errors, load_capacity: undefined } })}
                          placeholder="0.000"
                        />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={edit?.is_active ?? true}
                          onChange={(e) => setEdit((p) => p && { ...p, is_active: e.target.checked })}
                        />
                      </td>
                      <td colSpan={2} style={{ color: "#aaa" }}></td>
                      <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                        <button className="action-btn confirm" title="Сохранить" onClick={saveEdit}>✓</button>
                        <button className="action-btn danger" title="Отменить" onClick={askCancel}>✕</button>
                      </td>
                    </tr>
                  );
                }

                const f = row as Forklift;
                const isEditing = edit?.id === f.id;

                return (
                  <tr
                    key={f.id}
                    className={isEditing ? "row-editing" : f.id === selectedId ? "row-selected" : ""}
                    onClick={() => {
                      if (edit) return;
                      onSelect(f.id === selectedId ? null : f);
                    }}
                  >
                    <td>{f.id}</td>
                    <td>
                      {isEditing ? (
                        <input
                          ref={brandRef}
                          className={`cell-input${edit?.errors.brand ? " error" : ""}`}
                          value={edit?.brand ?? ""}
                          onChange={(e) => setEdit((p) => p && { ...p, brand: e.target.value, errors: { ...p.errors, brand: undefined } })}
                        />
                      ) : f.brand}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className={`cell-input${edit?.errors.number ? " error" : ""}`}
                          value={edit?.number ?? ""}
                          onChange={(e) => setEdit((p) => p && { ...p, number: e.target.value, errors: { ...p.errors, number: undefined } })}
                        />
                      ) : f.number}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className={`cell-input${edit?.errors.load_capacity ? " error" : ""}`}
                          value={edit?.load_capacity ?? ""}
                          onChange={(e) => setEdit((p) => p && { ...p, load_capacity: e.target.value, errors: { ...p.errors, load_capacity: undefined } })}
                          placeholder="0.000"
                        />
                      ) : Number(f.load_capacity).toFixed(3)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={edit?.is_active ?? f.is_active}
                          onChange={(e) => setEdit((p) => p && { ...p, is_active: e.target.checked })}
                        />
                      ) : f.is_active ? (
                        <span className="check-icon">✓</span>
                      ) : null}
                    </td>
                    <td>{isEditing ? "" : fmt(f.modified_at)}</td>
                    <td>{isEditing ? currentUser : f.modified_by}</td>
                    <td style={{ textAlign: "center", whiteSpace: "nowrap" }}>
                      {isEditing ? (
                        <>
                          <button className="action-btn confirm" title="Сохранить" onClick={(e) => { e.stopPropagation(); saveEdit(); }}>✓</button>
                          <button className="action-btn danger" title="Отменить" onClick={(e) => { e.stopPropagation(); askCancel(); }}>✕</button>
                        </>
                      ) : (
                        <>
                          <button
                            className="action-btn"
                            title="Изменить"
                            disabled={!!edit}
                            onClick={(e) => { e.stopPropagation(); startEdit(f); }}
                          >✏</button>
                          <button
                            className="action-btn danger"
                            title="Удалить"
                            disabled={!!edit}
                            onClick={(e) => { e.stopPropagation(); askDelete(f); }}
                          >✕</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "#aaa", padding: 16 }}>
                    Нет данных
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Удалить погрузчик?"
        text="Вы уверены?"
        okText="Удалить"
        onOk={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmCancel}
        title="Не сохранять внесенные изменения?"
        text="Вы уверены?"
        okText="Да, отменить"
        onOk={doCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
};
