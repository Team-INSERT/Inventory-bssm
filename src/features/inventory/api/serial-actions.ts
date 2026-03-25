"use server";

import { getSupabaseAdminClient } from "@/shared/api/supabase/server";
import { revalidatePath } from "next/cache";

export async function addSerialNumber(
  item_id: string,
  serial_number: string,
  warehouse_id?: string,
) {
  const supabase = await getSupabaseAdminClient();

  const dataToInsert: any = {
    item_id,
    serial_number,
    status: "AVAILABLE",
  };

  if (warehouse_id && warehouse_id !== "none") {
    dataToInsert.warehouse_id = warehouse_id;
  }

  const { error } = await supabase.from("item_serials").insert(dataToInsert);

  if (!error) {
    // Update inventory table to reflect the serial-based item
    if (warehouse_id && warehouse_id !== "none") {
      const { data: existingInv } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("item_id", item_id)
        .eq("warehouse_id", warehouse_id)
        .single();

      if (existingInv) {
        // Increment existing inventory
        await supabase
          .from("inventory")
          .update({ quantity: existingInv.quantity + 1 })
          .eq("item_id", item_id)
          .eq("warehouse_id", warehouse_id);
      } else {
        // Create new inventory record
        await supabase.from("inventory").insert({
          item_id,
          warehouse_id,
          quantity: 1,
        });
      }
    }

    revalidatePath("/admin/items");
    revalidatePath("/admin");
    revalidatePath("/");
  }

  return { error: error?.message };
}

export async function addBulkSerialNumbers(
  item_id: string,
  serials: string[],
  warehouse_id?: string,
) {
  const supabase = await getSupabaseAdminClient();

  const dataToInsert = serials.map((serial) => {
    const data: any = {
      item_id,
      serial_number: serial,
      status: "AVAILABLE",
    };
    if (warehouse_id && warehouse_id !== "none") {
      data.warehouse_id = warehouse_id;
    }
    return data;
  });

  const { error } = await supabase.from("item_serials").insert(dataToInsert);

  if (!error) {
    // Update inventory table to reflect the serial-based items
    if (warehouse_id && warehouse_id !== "none") {
      const { data: existingInv } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("item_id", item_id)
        .eq("warehouse_id", warehouse_id)
        .single();

      if (existingInv) {
        // Increment existing inventory by number of serials added
        await supabase
          .from("inventory")
          .update({ quantity: existingInv.quantity + serials.length })
          .eq("item_id", item_id)
          .eq("warehouse_id", warehouse_id);
      } else {
        // Create new inventory record with quantity = number of serials
        await supabase.from("inventory").insert({
          item_id,
          warehouse_id,
          quantity: serials.length,
        });
      }
    }

    revalidatePath("/admin/items");
    revalidatePath("/admin");
    revalidatePath("/");
  }

  return { error: error?.message };
}

export async function deleteSerialNumber(id: string) {
  const supabase = await getSupabaseAdminClient();

  // Get serial info before deleting
  const { data: serialData } = await supabase
    .from("item_serials")
    .select("item_id, warehouse_id")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("item_serials").delete().eq("id", id);

  if (!error && serialData) {
    // Update inventory table - decrease quantity by 1
    if (serialData.warehouse_id) {
      const { data: existingInv } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("item_id", serialData.item_id)
        .eq("warehouse_id", serialData.warehouse_id)
        .single();

      if (existingInv && existingInv.quantity > 1) {
        // Decrease inventory
        await supabase
          .from("inventory")
          .update({ quantity: existingInv.quantity - 1 })
          .eq("item_id", serialData.item_id)
          .eq("warehouse_id", serialData.warehouse_id);
      } else if (existingInv) {
        // Delete inventory record if quantity becomes 0
        await supabase
          .from("inventory")
          .delete()
          .eq("item_id", serialData.item_id)
          .eq("warehouse_id", serialData.warehouse_id);
      }
    }

    revalidatePath("/admin/items");
    revalidatePath("/admin");
  }

  return { error: error?.message };
}

export async function updateSerialNumberStatus(
  id: string,
  status: string,
  warehouse_id?: string | null,
) {
  const supabase = await getSupabaseAdminClient();

  // Get current serial info
  const { data: currentSerial } = await supabase
    .from("item_serials")
    .select("item_id, warehouse_id")
    .eq("id", id)
    .single();

  const dataToUpdate: any = { status };

  const newWarehouseId = warehouse_id === "none" ? null : warehouse_id;
  if (warehouse_id !== undefined) {
    dataToUpdate.warehouse_id = newWarehouseId;
  }

  const { error } = await supabase
    .from("item_serials")
    .update(dataToUpdate)
    .eq("id", id);

  if (!error && currentSerial) {
    // If warehouse changed, update inventory for both old and new warehouses
    if (
      warehouse_id !== undefined &&
      currentSerial.warehouse_id !== newWarehouseId
    ) {
      // Decrease from old warehouse
      if (currentSerial.warehouse_id) {
        const { data: oldInv } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("item_id", currentSerial.item_id)
          .eq("warehouse_id", currentSerial.warehouse_id)
          .single();

        if (oldInv && oldInv.quantity > 1) {
          await supabase
            .from("inventory")
            .update({ quantity: oldInv.quantity - 1 })
            .eq("item_id", currentSerial.item_id)
            .eq("warehouse_id", currentSerial.warehouse_id);
        } else if (oldInv) {
          await supabase
            .from("inventory")
            .delete()
            .eq("item_id", currentSerial.item_id)
            .eq("warehouse_id", currentSerial.warehouse_id);
        }
      }

      // Increase in new warehouse
      if (newWarehouseId) {
        const { data: newInv } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("item_id", currentSerial.item_id)
          .eq("warehouse_id", newWarehouseId)
          .single();

        if (newInv) {
          await supabase
            .from("inventory")
            .update({ quantity: newInv.quantity + 1 })
            .eq("item_id", currentSerial.item_id)
            .eq("warehouse_id", newWarehouseId);
        } else {
          await supabase.from("inventory").insert({
            item_id: currentSerial.item_id,
            warehouse_id: newWarehouseId,
            quantity: 1,
          });
        }
      }
    }

    revalidatePath("/admin/items");
    revalidatePath("/admin");
  }

  return { error: error?.message };
}

export async function getAvailableSerials(item_id: string, warehouse_id: string) {
  const supabase = await getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("item_serials")
    .select("id, serial_number")
    .eq("item_id", item_id)
    .eq("warehouse_id", warehouse_id)
    .eq("status", "AVAILABLE");
    
  if (error) {
    console.error("Error fetching serials (Server Action):", error);
    return { data: null, error: error.message || error };
  }
  return { data, error: null };
}
