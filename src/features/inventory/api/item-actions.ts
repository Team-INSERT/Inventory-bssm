"use server";

import { createClient } from "@/shared/api/supabase/server";
import { revalidatePath } from "next/cache";

export async function createItem(formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const category = formData.get("category") as string;
  const barcode = formData.get("barcode") as string;
  const min_stock = parseInt(formData.get("min_stock") as string, 10);
  const production_year =
    parseInt(formData.get("production_year") as string, 10) || null;
  const has_serial_number = formData.get("has_serial_number") === "true";
  const has_service_life = formData.get("has_service_life") === "true";
  const service_life = has_service_life ?
    parseInt(formData.get("service_life") as string, 10) || null : null;
  const imageFile = formData.get("image") as File | null;

  let image_url = null;

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `items/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("item-images")
      .upload(filePath, imageFile);

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("item-images").getPublicUrl(filePath);

      image_url = publicUrl;
    }
  }

  const { data: itemData, error } = await supabase
    .from("items")
    .insert({
      name,
      category,
      barcode,
      min_stock,
      production_year,
      service_life,
      has_serial_number,
      has_service_life,
      image_url,
    })
    .select("id")
    .single();

  if (!error && itemData) {
    const warehouse_id = formData.get("warehouse_id") as string;
    const initial_quantity =
      parseInt(formData.get("initial_quantity") as string, 10) || 0;

    if (!has_serial_number && warehouse_id && warehouse_id !== "none" && initial_quantity > 0) {
      await supabase.from("inventory").insert({
        item_id: itemData.id,
        warehouse_id,
        quantity: initial_quantity,
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("transactions").insert({
          item_id: itemData.id,
          to_warehouse_id: warehouse_id,
          user_id: user.id,
          quantity: initial_quantity,
          type: "IN",
          reason: "신규 물품 등록 초도 입고",
        });
      }
    }

    revalidatePath("/admin/items");
    revalidatePath("/admin");
    revalidatePath("/");
    revalidatePath("/history"); // 기록 페이지도 revalidate
  }

  return { error: error?.message };
}

export async function updateItem(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from("items").update(data).eq("id", id);

  if (!error) {
    revalidatePath("/admin/items");
    revalidatePath("/admin");
    revalidatePath("/");
  }
  return { error: error?.message };
}

export async function deleteItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);

  if (!error) {
    revalidatePath("/admin/items");
    revalidatePath("/admin");
  }
}
