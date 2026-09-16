export type AssetSearchResult = {
  symbol: string;
  name: string;
  exchange: string;
  micCode?: string;
  country?: string;
  currency: string;
  type: string;
  tags?: string[];
};

export type AnnualReturn = { percent: number; from: string; to: string; source: 'twelve-data' };

export type AssetQuote = AssetSearchResult & {
  price: number;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  percentChange?: number;
  volume?: number;
  marketOpen?: boolean;
  fiftyTwoWeekLow?: number;
  fiftyTwoWeekHigh?: number;
  asOf: string;
  source: 'twelve-data' | 'illustrative';
  description?: string;
  sector?: string;
  industry?: string;
  website?: string;
  oneYearReturn?: AnnualReturn;
};

export type AssetSearchResponse = { results: AssetSearchResult[]; configured: boolean; source: AssetQuote['source'] };
