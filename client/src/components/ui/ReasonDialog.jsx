import React, { useState } from 'react';
import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';

export function ReasonDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Reason Required',
  description = 'Please provide a clinical or operational reason to proceed.',
  placeholder = 'Enter reason (minimum 5 characters)...',
  confirmLabel = 'Confirm Action',
  confirmVariant = 'primary',
  isLoading = false,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason || reason.trim().length < 5) {
      setError('Please enter a reason with at least 5 characters.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} description={description}>
      <div className="space-y-3">
        <div>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim().length >= 5) setError('');
            }}
            placeholder={placeholder}
            rows={3}
            className="w-full text-xs p-3 rounded-lg border border-line focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none bg-slate-50"
            autoFocus
          />
          {error && <p className="text-[11px] text-fever mt-1">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-line/40">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            size="sm"
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={reason.trim().length < 5}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
