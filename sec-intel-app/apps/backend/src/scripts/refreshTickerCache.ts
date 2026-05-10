import { SecClient } from "../lib/secClient.js";
import { upsertCompany } from "../lib/repository.js";

const secClient = new SecClient();

async function main() {
  const tickerMap = await secClient.getTickerMap();

  for (const entry of tickerMap.values()) {
    await upsertCompany({
      ticker: entry.ticker.toUpperCase(),
      cik: String(entry.cik_str).padStart(10, "0"),
      companyName: entry.title,
      sic: null,
      fiscalYearEnd: null
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

