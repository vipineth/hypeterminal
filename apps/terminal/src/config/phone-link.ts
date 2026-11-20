export const PHONE_LINK_ROUTE = "/link";

// One fixed name means linking a second phone replaces the first: Hyperliquid deregisters a
// named agent when approveAgent is sent again with the same name. Must stay at most 16 chars
// and must not be "Mobile QR", which Hyperliquid's own app uses.
export const PHONE_LINK_AGENT_NAME = "HT Mobile";

export const PHONE_LINK_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;

export const PHONE_LINK_QR_VISIBLE_MS = 60 * 1000;
