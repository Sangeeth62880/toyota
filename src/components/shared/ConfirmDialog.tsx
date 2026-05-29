"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  /** Display state toggle */
  open: boolean;
  /** Title header explanation */
  title: string;
  /** Detailed warning description */
  description: string;
  /** Confirm action CTA text tag (defaults to "Confirm") */
  confirmLabel?: string;
  /** Theme styling variant (danger = Toyota Red CTA, primary = black CTA) */
  confirmVariant?: "danger" | "primary";
  /** Confirm action event trigger callback */
  onConfirm: () => void;
  /** Cancel action event trigger callback */
  onCancel: () => void;
}

/**
 * Toyota Incentive Portal — Shared Confirmation Alert Dialog.
 *
 * Implements accessible confirmation workflows:
 * - Uses Radix Alert Dialog to handle focus traps and escape key events.
 * - Backdrop overlay with glassmorphism blur styling.
 * - Brand-red ("danger") or brand-black ("primary") buttons, formatted with sharp corners.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root open={open}>
      <AlertDialog.Portal>
        {/* Backdrop glass blur overlay */}
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" />

        {/* Action card modal overlay */}
        <AlertDialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-[420px] -translate-x-[50%] -translate-y-[50%] bg-white rounded-[4px] border border-[#E5E5E5] p-6 shadow-2xl focus:outline-none select-none font-sans animate-in zoom-in-95 duration-200">
          
          {/* Header Dialog Texts */}
          <AlertDialog.Title className="font-sans font-bold text-[17px] text-[#0A0A0A] leading-tight">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="font-sans font-normal text-[13.5px] text-[#767676] leading-relaxed mt-2.5">
            {description}
          </AlertDialog.Description>

          {/* Action Row Deck */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-[#F4F4F4]">
            
            {/* Cancel Action Trigger */}
            <AlertDialog.Cancel
              onClick={onCancel}
              className="h-[38px] px-5 text-[13px] font-semibold text-[#0A0A0A] hover:bg-[#F4F4F4] transition-colors rounded-none border border-[#E0E0E0] focus:outline-none cursor-pointer"
            >
              Cancel
            </AlertDialog.Cancel>

            {/* Confirm Action Trigger */}
            <AlertDialog.Action
              onClick={onConfirm}
              className={cn(
                "h-[38px] px-5 text-[13px] font-semibold text-white rounded-none transition-colors duration-200 flex items-center justify-center focus:outline-none cursor-pointer",
                confirmVariant === "danger"
                  ? "bg-[#EB0A1E] hover:bg-[#C5081A]"
                  : "bg-[#0A0A0A] hover:bg-[#1a1a1a]"
              )}
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
