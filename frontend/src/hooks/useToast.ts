import { useContext, useMemo, useCallback } from 'react';
import { ToastContext } from '../context/ToastContext';

export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    const { addToast, removeToast } = context;

    const success = useCallback((message: string, duration?: number) => addToast(message, 'success', duration), [addToast]);
    const error = useCallback((message: string, duration?: number) => addToast(message, 'error', duration), [addToast]);
    const info = useCallback((message: string, duration?: number) => addToast(message, 'info', duration), [addToast]);
    const warning = useCallback((message: string, duration?: number) => addToast(message, 'warning', duration), [addToast]);

    return useMemo(() => ({
        success,
        error,
        info,
        warning,
        remove: removeToast
    }), [success, error, info, warning, removeToast]);
};
