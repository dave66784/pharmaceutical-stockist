import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    const { addToast, removeToast } = context;

    const toast = {
        success: (message: string, duration?: number) => addToast(message, 'success', duration),
        error: (message: string, duration?: number) => addToast(message, 'error', duration),
        info: (message: string, duration?: number) => addToast(message, 'info', duration),
        warning: (message: string, duration?: number) => addToast(message, 'warning', duration),
        remove: removeToast
    };

    return toast;
};
