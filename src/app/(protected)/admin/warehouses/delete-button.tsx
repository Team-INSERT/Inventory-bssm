"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteWarehouse } from "@/features/inventory/api/warehouse-actions";
import { ConfirmModal } from "@/shared/ui/confirm-modal";

export function DeleteWarehouseButton({ id }: { id: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deleteWarehouse(id);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={isPending}
        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={handleDelete}
        title="창고 삭제"
        message={
          <>
            정말 이 창고를 삭제하시겠습니까?
            <br />
            연결된 재고 데이터에 영향을 줄 수 있습니다.
          </>
        }
        confirmText="삭제하기"
      />
    </>
  );
}
