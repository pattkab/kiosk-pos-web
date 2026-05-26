import { createClient } from "@/lib/supabase/server";

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("products").select("*");
  if (error) throw error;
  return data;
}

export async function getOrganization(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}
