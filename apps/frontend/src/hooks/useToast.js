import { useContext } from 'react';
import { ToastProvider } from './ToastProvider';
import { ToastContext } from './toastContext';

export { ToastProvider };

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    return { addToast: (msg) => console.log(msg) };
  }
  return context;
}
