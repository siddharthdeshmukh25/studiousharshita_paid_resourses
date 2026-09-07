'use client';

import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmationModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.paddingRight = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      confirm: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
      confirmShadow: 'shadow-lg shadow-red-500/30'
    },
    warning: {
      icon: AlertCircle,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      confirm: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
      confirmShadow: 'shadow-lg shadow-yellow-500/30'
    },
    info: {
      icon: Info,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      confirm: 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-deep)] hover:from-[var(--accent-deep)] hover:to-[var(--accent-deep)]',
      confirmShadow: 'shadow-lg shadow-blue-500/30'
    }
  };

  const currentStyle = variantStyles[variant];
  const Icon = currentStyle.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-gray-200 transform transition-all duration-200 scale-in">
        <div className="p-6">
          {/* Icon */}
          <div className={`mx-auto w-14 h-14 rounded-full ${currentStyle.iconBg} flex items-center justify-center mb-4`}>
            <Icon className={`h-7 w-7 ${currentStyle.iconColor}`} />
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-gray-900 text-center mb-2">{title}</h2>

          {/* Message */}
          <p className="text-gray-600 text-sm text-center leading-relaxed mb-6">{message}</p>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50 transition-all duration-150"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2.5 text-white rounded-xl font-medium text-sm transition-all duration-150 hover:scale-102 active:scale-98 ${currentStyle.confirm} ${currentStyle.confirmShadow}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}