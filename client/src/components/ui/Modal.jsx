import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn.js';

export function Modal({ isOpen, onClose, title, description, children, maxWidth = 'max-w-lg' }) {
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[92vw]',
            maxWidth,
            'bg-white rounded-2xl p-5 shadow-xl border border-line/80 focus:outline-none animate-in zoom-in-95'
          )}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              {title && (
                <DialogPrimitive.Title className="text-base font-semibold text-brand-ink leading-snug">
                  {title}
                </DialogPrimitive.Title>
              )}
              {description && (
                <DialogPrimitive.Description className="text-xs text-text-secondary mt-0.5">
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>
            <DialogPrimitive.Close className="rounded-lg p-1 text-slate-400 hover:text-brand-ink hover:bg-slate-100 transition-colors">
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>

          <div>{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
