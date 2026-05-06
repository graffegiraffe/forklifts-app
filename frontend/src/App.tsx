import React, { useState } from "react";
import { ForkliftTable } from "./components/ForkliftTable";
import { IncidentTable } from "./components/IncidentTable";
import type { Forklift } from "./types";

const NAV_ITEMS = [
  { label: "Пользователи", key: "users" },
  { label: "Уведомления\nи напоминания", key: "notifications" },
  { label: "Настройки\nАИС ОГПА", key: "settings" },
  { label: "Справочник\nпогрузчиков", key: "forklifts" },
  { label: "Резервное\nкопирование и\nвосстановление", key: "backup" },
  { label: "Справочники", key: "refs" },
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState("Иванов И И");
  const [selectedForklift, setSelectedForklift] = useState<Forklift | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <button
          className="app-header-profile"
          onClick={() => setShowProfile((v) => !v)}
        >
          Профиль
        </button>

        {/* Simple profile popup */}
        {showProfile && (
          <div
            style={{
              position: "absolute",
              top: 48,
              right: 24,
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 4,
              padding: "12px 16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              zIndex: 200,
              minWidth: 220,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 13, marginBottom: 8, color: "#555" }}>
              Текущий пользователь (ФИО):
            </div>
            <input
              style={{
                border: "1px solid #ccc",
                borderRadius: 3,
                padding: "4px 8px",
                fontSize: 13,
                width: "100%",
                outline: "none",
              }}
              value={currentUser}
              onChange={(e) => setCurrentUser(e.target.value)}
              placeholder="Введите ФИО"
            />
            <button
              className="btn btn-gray"
              style={{ marginTop: 8, width: "100%" }}
              onClick={() => setShowProfile(false)}
            >
              Закрыть
            </button>
          </div>
        )}
      </header>

      {/* Sidebar */}
      <nav className="app-sidebar">
        {NAV_ITEMS.map((item) => (
          <div
            key={item.key}
            className={`sidebar-item${item.key === "forklifts" ? " active" : ""}`}
            style={{ whiteSpace: "pre-line" }}
          >
            {item.label}
          </div>
        ))}
      </nav>

      {/* Content */}
      <main className="app-content" onClick={() => showProfile && setShowProfile(false)}>
        <div className="main-panels">
          <div className="panel-left">
            <ForkliftTable
              currentUser={currentUser}
              selectedId={selectedForklift?.id ?? null}
              onSelect={setSelectedForklift}
              onDataChanged={() => setRefreshKey((k) => k + 1)}
              refreshKey={refreshKey}
            />
          </div>
          <div className="panel-right">
            <IncidentTable
              forklift={selectedForklift}
              onIncidentChanged={() => setRefreshKey((k) => k + 1)}
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default App;
