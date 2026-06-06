import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("user_calibration")
    .select("*")
    .eq("user_id", session.user.id)
    .single();

  return NextResponse.json({
    peak_offset_min: data?.peak_offset_min ?? 0,
    melatonin_sensitivity_min: data?.melatonin_sensitivity_min ?? 0,
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = createServiceClient();

  const { error } = await supabase.from("user_calibration").upsert(
    {
      user_id: session.user.id,
      peak_offset_min: Number(body.peak_offset_min ?? 0),
      melatonin_sensitivity_min: Number(body.melatonin_sensitivity_min ?? 0),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
