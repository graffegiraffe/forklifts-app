import React from "react";

interface Props {
  open: boolean;
  title: string;
  text?: string;
  okText?: string;
  cancelText?: string;
  danger?: boolean;
  onOk: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<Props> = ({
  open,
  title,
  text = "Вы уверены?",
  okText = "Да",
  cancelText = "Отмена",
  danger = true,
  onOk,
  onCancel,
}) => {
  if (!open) return null;
  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">{title}</div>
        <div className="confirm-text">{text}</div>
        <div className="confirm-actions">
          <button className={`btn ${danger ? "btn-red" : "btn-red"}`} onClick={onOk}>
            {okText}
          </button>
          <button className="btn btn-gray" onClick={onCancel}>
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};
