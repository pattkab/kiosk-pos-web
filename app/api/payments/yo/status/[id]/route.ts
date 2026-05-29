import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refreshYoCollectionStatus } from "@/lib/payments/yo/service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const refreshed = await refreshYoCollectionStatus(id);
  if (!refreshed.ok) {
    return NextResponse.json({ error: refreshed.error }, { status: 404 });
  }

  const collection = refreshed.collection;

  const { data: allowed } = await supabase
    .from("payment_collections")
    .select("id")
    .eq("id", collection.id)
    .maybeSingle();

  if (!allowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ collection });
}
