import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export const useNotifications = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      const id = Date.now().toString();
      const toast: Toast = { id, message, type };
      setToasts((prev) => [...prev, toast]);

      setTimeout(() => {
        removeNotification(id);
      }, 3000);

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, addNotification, removeNotification };
};