"use server";

import { createClient } from "@/shared/api/supabase/server";
import { revalidatePath } from "next/cache";
import { TransactionType, SerialStatus } from "@/shared/types";

export async function updateInventory(formData: FormData) {
  const { getSupabaseAdminClient } =
    await import("@/shared/api/supabase/server");
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = await getSupabaseAdminClient();

  const item_id = formData.get("item_id") as string;
  const warehouse_id = formData.get("warehouse_id") as string;
  const serial_id = formData.get("serial_id") as string | null;
  const reason = formData.get("reason") as string;
  const isDisposal = formData.get("is_disposal") === "true";

  let change = 0;
  let transactionType = TransactionType.OUT as TransactionType;

  // If not serial-based, get change from formData
  if (!serial_id) {
    change = parseInt(formData.get("change") as string, 10);
    transactionType = change > 0 ? TransactionType.IN : TransactionType.OUT;
  } else {
    // Serial-based: type comes from formData
    const typeStr = formData.get("type") as string;
    transactionType =
      typeStr === "IN" ? TransactionType.IN : TransactionType.OUT;
  }

  // Handle serial-based inventory update
  if (serial_id) {
    // Verify the serial exists and belongs to this item/warehouse
    const { data: serialData, error: fetchError } = await supabase
      .from("item_serials")
      .select("serial_number")
      .eq("id", serial_id)
      .eq("item_id", item_id)
      .eq("warehouse_id", warehouse_id)
      .single();

    if (fetchError || !serialData) {
      return { error: "시리얼 번호를 찾을 수 없습니다." };
    }

    // Update item_serial status
    const newStatus =
      transactionType === TransactionType.IN
        ? SerialStatus.AVAILABLE
        : SerialStatus.IN_USE;
    const { error: updateError } = await supabase
      .from("item_serials")
      .update({ status: newStatus })
      .eq("id", serial_id);

    if (updateError) return { error: updateError.message };

    // Update inventory quantity
    const { data: inv } = await supabase
      .from("inventory")
      .select("quantity")
      .eq("item_id", item_id)
      .eq("warehouse_id", warehouse_id)
      .single();

    const currentQty = inv?.quantity || 0;
    const newQty =
      transactionType === TransactionType.OUT ? currentQty - 1 : currentQty + 1;

    if (newQty <= 0) {
      // Delete inventory if quantity reaches 0
      await supabase
        .from("inventory")
        .delete()
        .eq("item_id", item_id)
        .eq("warehouse_id", warehouse_id);
    } else {
      // Update inventory quantity
      await supabase
        .from("inventory")
        .update({ quantity: newQty })
        .eq("item_id", item_id)
        .eq("warehouse_id", warehouse_id);
    }

    // Log transaction for serial-based adjustment
    // Include serial number in reason since transactions table doesn't have serial_id field yet
    const serialReason = `[시리얼: ${serialData.serial_number}] ${reason}`;

    const txData = {
      item_id,
      user_id: user.id,
      quantity: 1, // Serial items are counted as 1
      type: transactionType,
      reason: serialReason,
      from_warehouse_id:
        transactionType === TransactionType.OUT ? warehouse_id : null,
      to_warehouse_id:
        transactionType === TransactionType.IN ? warehouse_id : null,
    };

    const { error: txError } = await supabase
      .from("transactions")
      .insert(txData);
    if (txError) return { error: txError.message };

    revalidatePath("/");
    revalidatePath("/checkout");
    revalidatePath("/history");
    revalidatePath("/admin/transactions");
    return { success: true };
  }

  // Handle quantity-based inventory update (existing logic)
  // 1. Check existing inventory
  const { data: inv } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("item_id", item_id)
    .eq("warehouse_id", warehouse_id)
    .single();

  const currentQty = inv?.quantity || 0;

  if (isDisposal) {
    // 2a. Full Disposal: Remove from inventory
    const { error: delError } = await supabase
      .from("inventory")
      .delete()
      .eq("item_id", item_id)
      .eq("warehouse_id", warehouse_id);

    if (delError) return { error: delError.message };
  } else {
    // 2b. Normal Adjustment
    const newQty = currentQty + change;
    if (newQty < 0) {
      return { error: "재고가 부족합니다." };
    }

    const { error: invError } = await supabase.from("inventory").upsert(
      {
        item_id,
        warehouse_id,
        quantity: newQty,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "item_id,warehouse_id" },
    );

    if (invError) return { error: invError.message };
  }

  // 3. Log transaction
  const txType = isDisposal
    ? TransactionType.DISPOSE
    : change > 0
      ? TransactionType.IN
      : TransactionType.OUT;
  const txQty = isDisposal ? currentQty : Math.abs(change);

  const txData = {
    item_id,
    user_id: user.id,
    quantity: txQty,
    type: txType,
    reason,
    from_warehouse_id: txType === TransactionType.OUT ? warehouse_id : null,
    to_warehouse_id: txType === TransactionType.IN ? warehouse_id : null,
  };

  await supabase.from("transactions").insert(txData);

  revalidatePath("/");
  revalidatePath("/history");
  revalidatePath("/admin/transactions");
  return { success: true };
}

export async function transferInventory(formData: FormData) {
  const { getSupabaseAdminClient } =
    await import("@/shared/api/supabase/server");
  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const supabase = await getSupabaseAdminClient();

  const item_id = formData.get("item_id") as string;
  const from_warehouse_id = formData.get("from_warehouse_id") as string;
  const to_warehouse_id = formData.get("to_warehouse_id") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const reason = formData.get("reason") as string;

  if (from_warehouse_id === to_warehouse_id)
    return { error: "출발지와 도착지 창고가 같습니다." };
  if (quantity <= 0) return { error: "수량은 1 이상이어야 합니다." };

  // We should ideally call an RPC function.
  // Wait, I created exactly this in the initial DB schema: process_transfer(p_item_id, p_from_wh, p_to_wh, p_quantity, p_user_id, p_reason)

  const { error } = await supabase.rpc("process_transfer", {
    p_item_id: item_id,
    p_from_warehouse_id: from_warehouse_id,
    p_to_warehouse_id: to_warehouse_id,
    p_quantity: quantity,
    p_user_id: user.id,
    p_reason: reason || "창고 간 그룹 이동",
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/transfer");
  revalidatePath("/transfer");
  revalidatePath("/history");
  revalidatePath("/admin/transactions");
  revalidatePath("/");
  return { success: true };
}
