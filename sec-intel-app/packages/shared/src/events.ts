import type { EventType } from "./types.js";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  BUYBACK_AUTHORIZATION: "Buyback Authorization",
  BUYBACK_COMPLETED: "Buyback Activity",
  PUBLIC_OFFERING: "Public Offering",
  SHELF_REGISTRATION: "Shelf Registration",
  ATM_PROGRAM: "ATM Program",
  REGISTERED_DIRECT_OFFERING: "Registered Direct Offering",
  CONVERTIBLE_DEBT: "Convertible Debt",
  WARRANT_ISSUANCE: "Warrant Issuance",
  RESALE_REGISTRATION: "Resale Registration",
  INSIDER_BUY: "Insider Buy",
  INSIDER_SELL: "Insider Sell",
  OTHER_FINANCING_EVENT: "Other Financing Event",
  NONE_FOUND: "No Relevant Events"
};
