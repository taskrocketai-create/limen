import type { ListingStatus, PropertyType, NotificationType } from "@/types/database";

export const PREVIEW_MODE =
  process.env.NEXT_PUBLIC_SUPABASE_URL === "https://placeholder.supabase.co" ||
  process.env.NEXT_PUBLIC_SUPABASE_URL === "" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL;

export const MOCK_REALTOR_NAME = "Sarah Hendricks";

export const MOCK_LISTINGS: {
  id: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  sqft: number | null;
  property_type: PropertyType | null;
  status: ListingStatus;
  intake_completed_at: string | null;
  created_at: string;
}[] = [
  {
    id: "preview-1",
    address_line1: "214 Oleander Drive",
    city: "Wilmington",
    state: "NC",
    zip: "28403",
    price: 549000,
    bedrooms: 4,
    bathrooms: 2.5,
    sqft: 2840,
    property_type: "single_family",
    status: "ai_ready",
    intake_completed_at: "2024-03-10T14:22:00Z",
    created_at: "2024-03-05T09:00:00Z",
  },
  {
    id: "preview-2",
    address_line1: "87 Wrightsville Ave",
    city: "Wilmington",
    state: "NC",
    zip: "28403",
    price: 389000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1680,
    property_type: "condo",
    status: "intake_pending",
    intake_completed_at: null,
    created_at: "2024-03-08T11:30:00Z",
  },
  {
    id: "preview-3",
    address_line1: "1102 Forest Hills Drive",
    city: "Wilmington",
    state: "NC",
    zip: "28401",
    price: 725000,
    bedrooms: 5,
    bathrooms: 3.5,
    sqft: 3910,
    property_type: "single_family",
    status: "reviewed",
    intake_completed_at: "2024-03-01T10:00:00Z",
    created_at: "2024-02-26T08:00:00Z",
  },
  {
    id: "preview-4",
    address_line1: "33 Anchor Lane",
    city: "Wrightsville Beach",
    state: "NC",
    zip: "28480",
    price: 1250000,
    bedrooms: 4,
    bathrooms: 4,
    sqft: 3200,
    property_type: "single_family",
    status: "submitted",
    intake_completed_at: "2024-02-18T09:00:00Z",
    created_at: "2024-02-14T08:00:00Z",
  },
  {
    id: "preview-5",
    address_line1: "509 Castle Hayne Rd",
    city: "Castle Hayne",
    state: "NC",
    zip: "28429",
    price: 299000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1420,
    property_type: "townhouse",
    status: "draft",
    intake_completed_at: null,
    created_at: "2024-03-11T16:00:00Z",
  },
  {
    id: "preview-6",
    address_line1: "7 Lumina Avenue",
    city: "Wrightsville Beach",
    state: "NC",
    zip: "28480",
    price: 975000,
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2100,
    property_type: "condo",
    status: "intake_received",
    intake_completed_at: "2024-03-09T17:45:00Z",
    created_at: "2024-03-06T10:00:00Z",
  },
];

export const MOCK_NOTIFICATIONS: {
  id: string;
  listing_id: string | null;
  type: NotificationType;
  message: string;
  read: boolean;
  created_at: string;
}[] = [
  {
    id: "notif-1",
    listing_id: "preview-1",
    type: "ai_ready",
    message: "AI listing copy is ready to review for 214 Oleander Drive.",
    read: false,
    created_at: "2024-03-10T15:00:00Z",
  },
  {
    id: "notif-2",
    listing_id: "preview-6",
    type: "intake_submitted",
    message: "Homeowner intake received for 7 Lumina Avenue.",
    read: false,
    created_at: "2024-03-09T17:45:00Z",
  },
  {
    id: "notif-3",
    listing_id: "preview-4",
    type: "mls_submitted",
    message: "33 Anchor Lane has been submitted to MLS. MLS # NC-2024-08821.",
    read: true,
    created_at: "2024-02-20T11:00:00Z",
  },
];

export const MOCK_LISTING_DETAIL = {
  id: "preview-1",
  address_line1: "214 Oleander Drive",
  address_line2: null,
  city: "Wilmington",
  state: "NC",
  zip: "28403",
  price: 549000,
  bedrooms: 4,
  bathrooms: 2.5,
  sqft: 2840,
  property_type: "single_family" as PropertyType,
  status: "ai_ready" as ListingStatus,
  intake_token: "00000000-0000-0000-0000-000000000001",
  intake_sent_at: "2024-03-05T09:30:00Z",
  intake_completed_at: "2024-03-10T14:22:00Z",
  mls_number: null,
  listing_details: {
    highlights: [
      "Natural light",
      "Updated kitchen",
      "Hardwood floors",
      "Large backyard",
      "Screened porch",
      "Two-car garage",
    ],
    recent_updates:
      "2022 – New architectural shingle roof. 2021 – Full kitchen renovation with quartz countertops, subway tile backsplash, and stainless steel appliances. 2019 – Both HVAC units replaced.",
    neighborhood_notes:
      "Walking distance to Forest Hills Park and Jungle Rapids. Top-rated Forest Hills Elementary is two blocks away. Quiet cul-de-sac street with friendly neighbours — we know everyone on the block. Ten minutes to downtown Wilmington's restaurants and river walk.",
    hoa_details: null,
    seller_notes:
      "The screened porch is where we've spent most of our time — morning coffee, summer evenings. The garden has established perennials that come back every spring.",
  },
  ai_outputs: [
    {
      id: "output-1",
      version: 2,
      listing_description:
        "Set on a quiet street in sought-after Forest Hills, 214 Oleander Drive is a beautifully maintained four-bedroom home where natural light and thoughtful updates combine to create an effortlessly liveable space. The fully renovated kitchen — completed in 2021 — anchors the main floor with quartz countertops, custom cabinetry, and a bright eat-in area that opens to the screened porch. Original hardwood floors flow throughout, lending warmth and character to every room.\n\nFour bedrooms accommodate family and guests with ease, while 2.5 baths — including a generous primary suite — offer the comfort of a home well considered. The two-car garage and large, private backyard complete the picture.\n\nA 2022 roof replacement and 2019 dual-HVAC upgrade mean the heavy lifting has been done. Located two blocks from Forest Hills Elementary and minutes from Jungle Rapids, the river walk, and the best of downtown Wilmington.",
      headline_variants: [
        "A Forest Hills Sanctuary, Thoughtfully Renewed",
        "Where Natural Light Meets Timeless Charm",
        "The One You Have Been Waiting For on Oleander",
      ],
      social_captions: {
        instagram:
          "Hardwood floors. A screened porch made for evening wine. A kitchen that actually makes you want to cook. 214 Oleander Drive in Wilmington's Forest Hills is ready for its next chapter — 4 beds, 2.5 baths, 2,840 sqft of beautifully updated living. New roof 2022. New kitchen 2021. New HVAC 2019. The work is done; now it's your turn.\n\n#WilmingtonNC #ForestHills #HomeForSale #NCRealEstate #WilmingtonRealEstate #JustListed #MovingToWilmington",
        facebook:
          "Just listed in Wilmington's beloved Forest Hills neighbourhood — 214 Oleander Drive offers 4 bedrooms, 2.5 bathrooms, and 2,840 sq ft of lovingly maintained living space.\n\nKey updates: 2022 roof, 2021 kitchen renovation with quartz countertops and stainless appliances, 2019 dual HVAC. Hardwood floors throughout, screened porch, two-car garage, and a large private backyard.\n\nTwo blocks from Forest Hills Elementary. Ten minutes to downtown Wilmington. Listed at $549,000. Schedule a showing today.",
        twitter:
          "Just listed: 214 Oleander Dr, Wilmington NC — 4bd/2.5ba, 2,840 sqft, renovated kitchen, new roof & HVAC. $549,000 in Forest Hills. 🏡",
      },
      generated_at: "2024-03-11T10:00:00Z",
      approved: false,
      approved_at: null,
    },
    {
      id: "output-2",
      version: 1,
      listing_description:
        "A previous version of the listing description would appear here.",
      headline_variants: [
        "Forest Hills Four-Bedroom, Move-In Ready",
        "Updated and Loved on Oleander Drive",
        "The Forest Hills Home Worth the Wait",
      ],
      social_captions: {
        instagram: "Previous Instagram caption.",
        facebook: "Previous Facebook caption.",
        twitter: "Previous Twitter caption.",
      },
      generated_at: "2024-03-10T16:00:00Z",
      approved: false,
      approved_at: null,
    },
  ],
};
