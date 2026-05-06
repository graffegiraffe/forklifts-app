import { UserOutlined } from "@ant-design/icons";
import { Input, Space, Typography } from "antd";
import React from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
}

export const UserSelector: React.FC<Props> = ({ value, onChange }) => (
  <Space>
    <UserOutlined />
    <Typography.Text type="secondary">Пользователь:</Typography.Text>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Введите ФИО"
      style={{ width: 220 }}
      maxLength={255}
    />
  </Space>
);
