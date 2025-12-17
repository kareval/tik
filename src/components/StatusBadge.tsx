import React from 'react';
import { Status } from '../types';

export const StatusBadge: React.FC<{ status: Status }> = ({ status }) => {
  const styles = {
    [Status.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    [Status.APPROVED_PM]: 'bg-blue-100 text-blue-800 border-blue-200',
    [Status.RATIFIED_MGR]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    [Status.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
  };

  const labels = {
    [Status.PENDING]: 'Pendiente',
    [Status.APPROVED_PM]: 'Aprobado PM',
    [Status.RATIFIED_MGR]: 'Ratificado',
    [Status.REJECTED]: 'Rechazado',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};