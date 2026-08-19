"use client";

import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/format";

type Props = {
  model: { name: string; size: number } | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeleteDialog({ model, busy, onCancel, onConfirm }: Props) {
  return (
    <Dialog open={model !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--color-danger)]" />
            Delete {model?.name}?
          </DialogTitle>
          <DialogDescription>
            This removes the weights from disk, freeing{" "}
            {model ? formatBytes(model.size) : "space"}. You&apos;ll have to re-download the model
            to use it again.
          </DialogDescription>
        </DialogHeader>
        <div className="px-5 py-4 text-xs text-[var(--color-fg-muted)]">
          Only want to free memory? Use <strong className="text-[var(--color-fg)]">Unload</strong>{" "}
          instead — it evicts the model from RAM/VRAM but keeps it on disk.
        </div>
        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} disabled={busy}>
            {busy ? "Deleting…" : "Delete from disk"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
