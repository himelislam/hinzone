import type { JSX, ReactNode } from 'react';

import FormAlert from '@/components/common/FormAlert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ConfirmDialogProps {
  readonly trigger: ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly confirmLabel?: string;
  readonly confirmVariant?: 'default' | 'destructive';
  readonly onConfirm: () => void;
  readonly isConfirming?: boolean;
  readonly confirmDisabled?: boolean;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly children?: ReactNode;
  // Shown inside the dialog itself, not by the caller's own page-level
  // FormAlert - DialogContent renders through a portal with a full-screen
  // overlay, so an error rendered on the page behind an open dialog is
  // invisible to the user until they close it (a real bug found reviewing
  // AdminDepositDetailPage: the mutation's error state was correct, but the
  // user could never see it while the confirmation was still open).
  readonly error?: string | null;
}

// ui_rules.md - "Destructive actions must require confirmation." One shared
// dialog for every approve/reject/cancel action site instead of repeating the
// same Dialog + header + footer markup at each (coding_rules.md #24). Always
// controlled (open/onOpenChange) rather than relying on DialogTrigger's own
// uncontrolled state, so the caller can close it only after its mutation
// actually succeeds instead of immediately on click.
const ConfirmDialog = ({
  trigger,
  title,
  description,
  confirmLabel = 'Confirm',
  confirmVariant = 'default',
  onConfirm,
  isConfirming = false,
  confirmDisabled = false,
  open,
  onOpenChange,
  children,
  error,
}: ConfirmDialogProps): JSX.Element => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogTrigger asChild>{trigger}</DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        {description ? <DialogDescription>{description}</DialogDescription> : null}
      </DialogHeader>
      {children}
      <FormAlert variant="destructive" message={error} />
      <DialogFooter showCloseButton>
        <Button
          type="button"
          variant={confirmVariant}
          onClick={onConfirm}
          disabled={isConfirming || confirmDisabled}
        >
          {isConfirming ? 'Please wait...' : confirmLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default ConfirmDialog;
