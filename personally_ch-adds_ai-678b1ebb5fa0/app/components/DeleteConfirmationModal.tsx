"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  loading?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  loading = false,
}: DeleteConfirmationModalProps) {
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="rounded-xl shadow-2xl p-8 max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-2">{title}</DialogTitle>
          <DialogDescription className="text-gray-500 text-base mb-8">
            <span
              className="block"
              dangerouslySetInnerHTML={{ __html: message }}
            ></span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-3">
          <Button
            variant="outline"
            className="border border-gray-300 text-gray-800 font-medium rounded-md px-6 py-2"
            onClick={handleClose}
            disabled={loading}
            title="Cancel"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-md px-6 py-2"
            onClick={onConfirm}
            disabled={loading}
            title="Delete"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>Yes, delete</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
