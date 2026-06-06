import { addDays, format } from "date-fns";
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
      const base = demoPrediction();
      const predictions = Array.from({ length: 7 }, (_, i) => ({
        ...base,
        date: format(addDays(new Date(), i), "yyyy-MM-dd"),
      }));
      return NextResponse.json({ predictions, demo: true });
    }

    const predictions = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(new Date(), i);
      const prediction = await buildPredictionForDate(userId, date);
      if (prediction) predictions.push(prediction);
    }

    return NextResponse.json({ predictions, demo: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prediction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
