import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

// Type definitions for the modal props
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  showCloseButton?: boolean;
}

/**
 * Custom application modal component.
 * Uses createPortal to render outside the main application hierarchy.
 * Includes Tailwind CSS for a modern, responsive design.
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  // Determine colors and icon based on type
  const typeStyles = {
    info: { 
      bgColor: 'bg-blue-500', 
      borderColor: 'border-blue-700', 
      textColor: 'text-blue-900',
      icon: (
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )
    },
    success: { 
      bgColor: 'bg-green-500', 
      borderColor: 'border-green-700', 
      textColor: 'text-green-900',
      icon: (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )
    },
    warning: { 
      bgColor: 'bg-yellow-500', 
      borderColor: 'border-yellow-700', 
      textColor: 'text-yellow-900',
      icon: (
        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
      )
    },
    error: { 
      bgColor: 'bg-red-500', 
      borderColor: 'border-red-700', 
      textColor: 'text-red-900',
      icon: (
        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      )
    },
  }[type];

  // Keydown listener for ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Modal Structure
  const modalContent = (
    // Backdrop - Fixed position, full screen, semi-transparent black background
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 transition-opacity duration-300">
      
      {/* Modal Container - Max width, responsive padding, shadow, rounded corners */}
      <div 
        className="relative w-full max-w-lg mx-auto bg-white rounded-xl shadow-2xl transform transition-all duration-300 scale-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className={`p-4 ${typeStyles.bgColor} bg-opacity-10 border-b-2 border-opacity-50 ${typeStyles.borderColor} flex items-center space-x-3 rounded-t-xl`}>
          <div className="flex-shrink-0">
            {typeStyles.icon}
          </div>
          <h3 id="modal-title" className={`text-xl font-semibold ${typeStyles.textColor}`}>
            {title}
          </h3>
          
          {/* Close Button (Top Right) */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 rounded-full transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          )}
        </div>

        {/* Body Content */}
        <div className="p-6 text-gray-700">
          <div className="text-sm">
            {message}
          </div>
        </div>

        {/* Footer / Action Button */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            type="button"
            className={`w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-6 py-2 text-base font-medium text-white sm:w-auto sm:text-sm 
                        ${typeStyles.bgColor} hover:${typeStyles.borderColor} hover:border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out`}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );

  // Use createPortal to render the modal directly under the document body
  return createPortal(modalContent, document.body);
};

export default Modal;