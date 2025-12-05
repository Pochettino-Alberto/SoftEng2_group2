import { useEffect, useState } from "react";

interface ToastProps {
    message: React.ReactNode;
    type?: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
    onDismiss?: () => void;
}

function getToastBackgroundColor(type: string | undefined) {
    switch (type) {
        case 'success':
            return 'bg-green-50';
        case 'warning':
            return 'bg-yellow-50';
        case 'error':
            return 'bg-red-50';
        case 'info':
        default:
            return 'bg-blue-50';
    }
}
function getToastBorderColor(type: string | undefined) {
    switch (type) {
        case 'success':
            return 'border-green-500';
        case 'warning':
            return 'border-yellow-500';
        case 'error':
            return 'border-red-500';
        case 'info':
        default:
            return 'border-blue-500';
    }
}
function getToastIconColor(type: string | undefined) {
    switch (type) {
        case 'success':
            return 'text-green-500';
        case 'warning':
            return 'text-yellow-500';
        case 'error':
            return 'text-red-500';
        case 'info':
        default:
            return 'text-blue-500';
    }
}
function getToastTextColor(type: string | undefined) {
    switch (type) {
        case 'success':
            return 'text-green-800';
        case 'warning':
            return 'text-yellow-800';
        case 'error':
            return 'text-red-800';
        case 'info':
        default:
            return 'text-blue-800';
    }
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onDismiss = () => {} }) => {
    const [isVisible, setIsVisible] = useState(false);
    const toastTextColor = getToastTextColor(type);
    const toastBorderColor = getToastBorderColor(type);
    const toastIconColor = getToastIconColor(type);
    const toastBgColor = getToastBackgroundColor(type);

    // 1. Mount effect: Show the toast
    useEffect(() => {
        // Set to visible after component mounts to trigger CSS transition
        setIsVisible(true);

        // 2. Auto-dismissal logic
        const timer = setTimeout(() => {
            // Start fade-out animation
            setIsVisible(false);

            // Call parent dismiss function after animation completes (300ms transition + 50ms buffer)
            const cleanupTimer = setTimeout(() => {
                onDismiss();
            }, 350);

            return () => clearTimeout(cleanupTimer);
        }, duration);

        // Cleanup function: Clear timeout if component unmounts early or duration changes
        return () => clearTimeout(timer);
    }, [duration, onDismiss]);

    // If the message is empty or null, don't render anything (handled by parent component)
    if (!message) return null;

    // The 'transform' class handles the slide-in/slide-out animation
    const transformClass = isVisible ? 'translate-x-0' : 'translate-x-full';

    return (
        <div className={`fixed right-0 top-12 md:bottom-8 z-[9999] p-4 transition-transform duration-300 ease-in-out ${transformClass}`}>
            <div className={`my-2 p-4 ${toastBgColor} border-l-4 ${toastBorderColor} rounded-r-lg w-full max-w-sm mx-auto shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden `}>
                <div className="flex items-center">
                    <svg className={`w-5 h-5 ${toastIconColor} mr-3 flex-shrink-0`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p id={`toast_message_${type}`} className={`${toastTextColor} font-medium`}>{message}</p>
                </div>
            </div>
        </div>
    );
};

export default Toast;