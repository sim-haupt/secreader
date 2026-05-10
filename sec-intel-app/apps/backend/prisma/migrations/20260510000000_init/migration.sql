CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  ticker TEXT NOT NULL UNIQUE,
  cik TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  sic TEXT,
  fiscal_year_end TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS filings (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  accession_number TEXT NOT NULL UNIQUE,
  filing_date DATE NOT NULL,
  report_date DATE,
  form TEXT NOT NULL,
  primary_document TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sec_url TEXT NOT NULL,
  raw_text_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS filings_company_id_filing_date_idx
  ON filings (company_id, filing_date DESC);

CREATE TABLE IF NOT EXISTS filing_documents (
  id BIGSERIAL PRIMARY KEY,
  filing_id BIGINT NOT NULL UNIQUE REFERENCES filings(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  raw_text_hash TEXT NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS filing_events (
  id BIGSERIAL PRIMARY KEY,
  filing_id BIGINT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  amount TEXT,
  securities TEXT,
  status TEXT,
  confidence TEXT NOT NULL,
  source_snippet TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS filing_events_filing_id_idx
  ON filing_events (filing_id);

CREATE INDEX IF NOT EXISTS filing_events_event_type_idx
  ON filing_events (event_type);

