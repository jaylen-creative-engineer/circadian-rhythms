import { NextResponse } from "next/server";
import {
  buildPredictionForDate,
  demoPrediction,
  resolveUserId,
} from "@/lib/predictions/service";

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

    return NextResponse.json({ prediction, demo: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
