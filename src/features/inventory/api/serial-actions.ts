"use server";

import { createClient } from "@/shared/api/supabase/server";
import { revalidatePath } from "next/cache";

export async function addSerialNumber(item_id: string, serial_number: string, warehouse_id?: string) {
  const supabase = await createClient();

  const dataToInsert: any = {
    item_id,
    serial_number,
    status: 'AVAILABLE'
  };

  if (warehouse_id && warehouse_id !== 'none') {
    dataToInsert.warehouse_id = warehouse_id;
  }

  const { error } = await supabase.from("item_serials").insert(dataToInsert);

  if (!error) {
    revalidatePath("/admin/items");
    revalidatePath("/admin");
    revalidatePath("/");
  }

  return { error: error?.message };
}

export async function addBulkSerialNumbers(item_id: string, serials: string[], warehouse_id?: string) {
  const supabase = await createClient();

  const dataToInsert = serials.map(serial => {
    const data: any = {
      item_id,
      serial_number: serial,
      status: 'AVAILABLE'
    };
    if (warehouse_id && warehouse_id !== 'none') {
      data.warehouse_id = warehouse_id;
    }
    return data;
  });

  const { error } = await supabase.from("item_serials").insert(dataToInsert);

  if (!error) {
    revalidatePath("/admin/items");
    revalidatePath("/admin");
    revalidatePath("/");
  }

  return { error: error?.message };
}

export async function deleteSerialNumber(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("item_serials").delete().eq("id", id);

  if (!error) {
    revalidatePath("/admin/items");
    revalidatePath("/admin");
  }

  return { error: error?.message };
}

export async function updateSerialNumberStatus(id: string, status: string, warehouse_id?: string | null) {
  const supabase = await createClient();
  const dataToUpdate: any = { status };
  
  if (warehouse_id !== undefined) {
    dataToUpdate.warehouse_id = warehouse_id === 'none' ? null : warehouse_id;
  }

  const { error } = await supabase.from("item_serials").update(dataToUpdate).eq("id", id);

  if (!error) {
    revalidatePath("/admin/items");
    revalidatePath("/admin");
  }

  return { error: error?.message };
}
