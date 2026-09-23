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

export type ChartPeriod = '1D' | '1W' | '1M' | '1Y';
export type AssetHistory = {
  symbol: string;
  exchange: string;
  currency: string;
  period: ChartPeriod;
  interval: string;
  timezone: string;
  points: Array<{ at: string; price: number }>;
  configured: boolean;
  source: AssetQuote['source'];
  fetchedAt: string;
};
