import React from 'react';
import Toast, { ToastProps } from './Toast';

interface ToastContainerProps {
    toasts: ToastProps[];
    removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col items-end space-y-4 pointer-events-none">
            {/* Wrapper to allow pointer events on toasts but not container */}
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast {...toast} onClose={removeToast} />
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
