import type { FinancialPeriod, FinancialTab } from '../store/useFinancialsStore';

export interface FinancialMetric {
  id: string;
  metric: string;
  explanation?: string;
  isExpandable?: boolean;
  subMetrics?: FinancialMetric[];
  isSubMetric?: boolean;
  values: {
    y0: number; // Current year/quarter (e.g., 2023 / Q4 2023)
    y1: number; // Previous year/quarter (e.g., 2022 / Q3 2023)
    y2: number;
    y3: number;
  };
  trend: 'up' | 'down' | 'neutral';
  yoyGrowth: number;
}

export interface FinancialStatement {
  headers: string[]; // e.g., ["Metric", "2023", "2022", "2021", "2020"] or Quarters
  rows: FinancialMetric[];
}

// Pseudo-random number generator to have consistent data per symbol
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function stringToSeed(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function generateTrendSeries(baseValue: number, volatility: number, seed: number, isQuarterly: boolean, isGrowing: boolean) {
  const values = [];
  let currentValue = baseValue;
  // If we want historical to be smaller (growing company)
  
  for (let i = 0; i < 4; i++) {
    values.push(currentValue);
    const rand = seededRandom(seed + i);
    const change = (rand * volatility * 2) - volatility;
    
    // Reverse engineer previous years/quarters
    const multiplier = isGrowing ? (1 - 0.1 - change) : (1 + 0.05 + change); 
    // for quarters, changes are smaller
    const periodMultiplier = isQuarterly ? (multiplier - 1) / 4 + 1 : multiplier;
    
    currentValue = currentValue * periodMultiplier;
  }
  
  return {
    y0: values[0],
    y1: values[1],
    y2: values[2],
    y3: values[3],
  };
}

export function generateFinancialData(symbol: string, tab: FinancialTab, period: FinancialPeriod): FinancialStatement {
  const seed = stringToSeed(symbol + tab + period);
  const isQuarterly = period === 'quarterly';
  
  // Base scale dependent on symbol hash to make AAPL look bigger than smaller caps
  const scaleSeed = Math.abs(stringToSeed(symbol)) % 1000;
  const scale = 1000000000 + (scaleSeed * 100000000); // 1B to 100B scale
  
  const headers = isQuarterly 
    ? ['Metric', 'Q4 2023', 'Q3 2023', 'Q2 2023', 'Q1 2023']
    : ['Metric', '2023', '2022', '2021', '2020'];

  const rows: FinancialMetric[] = [];
  
  const createMetric = (id: string, metric: string, baseMultiplier: number, volatility: number, isGrowing: boolean, explanation?: string, subMetrics?: FinancialMetric[]): FinancialMetric => {
    const baseVal = scale * baseMultiplier * (isQuarterly ? 0.25 : 1);
    const values = generateTrendSeries(baseVal, volatility, seed + stringToSeed(id), isQuarterly, isGrowing);
    
    const yoyGrowth = ((values.y0 - values.y1) / Math.abs(values.y1)) * 100;
    let trend: 'up' | 'down' | 'neutral' = 'neutral';
    if (yoyGrowth > 2) trend = 'up';
    else if (yoyGrowth < -2) trend = 'down';

    return {
      id,
      metric,
      explanation,
      values,
      trend,
      yoyGrowth,
      isExpandable: !!subMetrics && subMetrics.length > 0,
      subMetrics
    };
  };

  if (tab === 'income') {
    rows.push(
      createMetric('rev', 'Total Revenue', 3.5, 0.05, true, 'Total amount of money brought in by the company\'s operations.'),
      createMetric('cor', 'Cost of Revenue', 2.0, 0.04, true, 'Direct costs attributable to the production of the goods sold in a company.'),
      createMetric('gp', 'Gross Profit', 1.5, 0.06, true, 'Profit a company makes after deducting the costs associated with making and selling its products.'),
      createMetric('opex', 'Operating Expense', 0.5, 0.03, true, 'An expense a business incurs through its normal business operations.', [
        createMetric('rnd', 'Research & Development', 0.2, 0.05, true, 'Direct costs of R&D activities.'),
        createMetric('sga', 'Selling, General & Admin', 0.3, 0.02, true, 'Major non-production costs presented in an income statement.')
      ]),
      createMetric('opinc', 'Operating Income', 1.0, 0.1, true, 'Profit realized from a business\'s operations.'),
      createMetric('ni', 'Net Income', 0.8, 0.12, true, 'Sales minus cost of goods sold, general expenses, taxes, and interest.'),
      createMetric('eps', 'Diluted EPS', 0.00000005, 0.1, true, 'Earnings per share considering all convertible securities.')
    );
  } else if (tab === 'balance') {
    rows.push(
      createMetric('assets', 'Total Assets', 5.0, 0.02, true, 'Total amount of assets owned by the company.', [
        createMetric('ca', 'Current Assets', 2.0, 0.05, true, 'Assets expected to be sold or used as a result of standard business operations over the next year.'),
        createMetric('nca', 'Non-Current Assets', 3.0, 0.01, true, 'Long-term investments where the full value will not be realized within the accounting year.')
      ]),
      createMetric('liab', 'Total Liabilities', 3.0, 0.03, true, 'Combined debts and obligations that the company owes to outside parties.', [
        createMetric('cl', 'Current Liabilities', 1.0, 0.06, true, 'Short-term financial obligations that are due within one year.'),
        createMetric('ncl', 'Non-Current Liabilities', 2.0, 0.02, true, 'Long-term financial obligations.')
      ]),
      createMetric('equity', 'Shareholder Equity', 2.0, 0.04, true, 'The amount that would be returned to shareholders if all the assets were liquidated and all debts paid off.')
    );
  } else if (tab === 'cashflow') {
    rows.push(
      createMetric('ocf', 'Operating Cash Flow', 1.2, 0.08, true, 'Measure of the amount of cash generated by a company\'s normal business operations.'),
      createMetric('icf', 'Investing Cash Flow', -0.5, 0.15, false, 'Reports how much cash has been generated or spent from various investment-related activities.'),
      createMetric('fcf_f', 'Financing Cash Flow', -0.4, 0.2, false, 'Net flows of cash that are used to fund the company.'),
      createMetric('fcf', 'Free Cash Flow', 0.8, 0.1, true, 'Cash a company generates after accounting for cash outflows to support operations and maintain its capital assets.')
    );
  }

  // Calculate EBITDA for income statement explicitly if needed, but mock works fine.
  if (tab === 'income') {
      rows.push(createMetric('ebitda', 'EBITDA', 1.1, 0.09, true, 'Earnings Before Interest, Taxes, Depreciation, and Amortization'));
  }

  return { headers, rows };
}

export function formatLargeNumber(num: number): string {
  if (num === 0) return '0.00';
  const absNum = Math.abs(num);
  
  if (absNum >= 1e9) {
    return (num / 1e9).toFixed(2) + 'B';
  }
  if (absNum >= 1e6) {
    return (num / 1e6).toFixed(2) + 'M';
  }
  if (absNum >= 1e3) {
    return (num / 1e3).toFixed(2) + 'K';
  }
  return num.toFixed(2);
}
