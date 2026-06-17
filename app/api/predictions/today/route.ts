import { NextResponse } from "next/server";
import {
  buildPredictionForDate,
  demoPrediction,
} from "@/lib/predictions/service";
import { getStaticAppUserId, resolveUserId } from "@/lib/config/user";

export async function GET() {
  try {
    const userId = await resolveUserId();

    if (!userId) {
      return NextResponse.json({ prediction: demoPrediction(), demo: true });
    }

    const prediction = await buildPredictionForDate(userId, new Date());
    if (!prediction) {
      return NextResponse.json(
        { error: "No sleep data available. Connect WHOOP and sync." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      prediction,
      demo: false,
      staticUser: Boolean(getStaticAppUserId()),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
