/**
 * Flexmls Spark API client
 * Docs: https://sparkplatform.com/docs
 *
 * MLS path: Wilson Board of Realtors → NCRMLS → Hive MLS → Flexmls → Spark API
 *
 * Register at sparkplatform.com and obtain a SPARK_API_KEY before using.
 * All submissions are human-triggered — never auto-published.
 */

const SPARK_BASE_URL = "https://sparkapi.com/v1";

interface SparkListingPayload {
  // Required Spark fields (subset — full field list at sparkplatform.com/docs)
  ListPrice: number;
  UnparsedAddress: string;
  City: string;
  StateOrProvince: string;
  PostalCode: string;
  BedroomsTotal?: number;
  BathroomsTotalInteger?: number;
  LivingArea?: number;
  YearBuilt?: number;
  PropertyType?: string;
  PublicRemarks?: string;
}

interface SparkResponse {
  D: {
    Success: boolean;
    Results: { Id?: string; Message?: string }[];
  };
}

export async function submitListingToSpark(
  payload: SparkListingPayload
): Promise<{ mlsId: string }> {
  const apiKey = process.env.SPARK_API_KEY;
  if (!apiKey) throw new Error("SPARK_API_KEY is not configured.");

  const res = await fetch(`${SPARK_BASE_URL}/listings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ D: { Listings: [payload] } }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Spark API error ${res.status}: ${errorText}`);
  }

  const data: SparkResponse = await res.json();

  if (!data.D?.Success) {
    const msg = data.D?.Results?.[0]?.Message ?? "Unknown Spark API error";
    throw new Error(`Spark submission failed: ${msg}`);
  }

  const mlsId = data.D.Results[0]?.Id;
  if (!mlsId) throw new Error("Spark API returned success but no listing ID.");

  return { mlsId };
}
