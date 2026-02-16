import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
};

const styles = {
    success: 'bg-white border-l-4 border-green-500',
    error: 'bg-white border-l-4 border-red-500',
    info: 'bg-white border-l-4 border-blue-500',
    warning: 'bg-white border-l-4 border-yellow-500',
};

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 3000, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, id, onClose]);

    return (
        <div className={`flex items-start p-4 mb-3 rounded shadow-lg transform transition-all duration-300 hover:scale-102 ${styles[type]} min-w-[300px] animate-slide-in-right`}>
            <div className="flex-shrink-0 mr-3">
                {icons[type]}
            </div>
            <div className="flex-1 mr-2">
                <p className="text-sm font-medium text-gray-900">{message}</p>
            </div>
            <button
                onClick={() => onClose(id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-500 focus:outline-none"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export default Toast;
