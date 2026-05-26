import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { predictionId: string } }
) {
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: "Missing required environment variable: REPLICATE_API_TOKEN" },
      { status: 500 }
    );
  }

  try {
    const authHeader = ["Bearer", token].join(" ");
    const response = await fetch(`https://api.replicate.com/v1/predictions/${params.predictionId}`, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      return NextResponse.json(
        { error: `Replicate API request failed (${response.status}): ${details || response.statusText}` },
        { status: 500 }
      );
    }

    const prediction = await response.json() as {
      status?: string;
      output?: string | string[] | null;
    };

    if (prediction.status === "succeeded") {
      const imageUrl = Array.isArray(prediction.output)
        ? prediction.output.find((item) => typeof item === "string") ?? null
        : typeof prediction.output === "string"
          ? prediction.output
          : null;
      return NextResponse.json({ status: "succeeded", imageUrl });
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      return NextResponse.json({ status: "failed", imageUrl: null });
    }

    return NextResponse.json({ status: prediction.status ?? "processing", imageUrl: null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch Replicate prediction." },
      { status: 500 }
    );
  }
}
