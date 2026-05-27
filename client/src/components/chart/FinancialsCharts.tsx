import { useMemo } from 'react';
import type { FinancialStatement } from '@/lib/financialsData';
import { formatLargeNumber } from '@/lib/financialsData';
import type { FinancialTab } from '@/store/useFinancialsStore';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend } from 'recharts';

interface FinancialsChartsProps {
  data: FinancialStatement;
  tab: FinancialTab;
}

export function FinancialsCharts({ data, tab }: FinancialsChartsProps) {
  const chartData = useMemo(() => {
    // We want data chronologically (oldest to newest)
    // headers are like ["Metric", "2023", "2022", "2021", "2020"] (y0, y1, y2, y3)
    const periods = [data.headers[4], data.headers[3], data.headers[2], data.headers[1]];
    
    return periods.map((period, index) => {
      const yearIdx = 3 - index; // y3, y2, y1, y0
      const point: any = { name: period };
      
      data.rows.forEach(row => {
        // e.g. row.values.y0 for 2023
        const val = yearIdx === 0 ? row.values.y0 :
                    yearIdx === 1 ? row.values.y1 :
                    yearIdx === 2 ? row.values.y2 :
                    row.values.y3;
        point[row.id] = val;
      });
      return point;
    });
  }, [data]);

  const renderTooltip = (props: any) => {
    const { active, payload, label } = props;
    if (active && payload && payload.length) {
      return (
        <div className="bg-bg-surface border border-border-primary p-3 rounded-lg shadow-xl">
          <p className="text-[12px] font-bold text-text-primary mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-[12px]">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-text-secondary">{entry.name}:</span>
              <span className="font-mono-numbers font-medium text-text-primary">
                ${formatLargeNumber(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderIncomeChart = () => (
    <div className="w-full h-full flex flex-col relative">
      <h3 className="text-[12px] font-bold text-text-muted mb-4 absolute top-0 left-0">Revenue & Net Income Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 25, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2196F3" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#2196F3" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorNi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#26A69A" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#26A69A" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2E39" vertical={false} />
          <XAxis dataKey="name" stroke="#787B86" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => `$${formatLargeNumber(v)}`} stroke="#787B86" fontSize={11} tickLine={false} axisLine={false} width={60} />
          <Tooltip content={renderTooltip} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#787B86' }} />
          <Area type="monotone" dataKey="rev" name="Total Revenue" stroke="#2196F3" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
          <Area type="monotone" dataKey="ni" name="Net Income" stroke="#26A69A" strokeWidth={2} fillOpacity={1} fill="url(#colorNi)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const renderBalanceChart = () => (
    <div className="w-full h-full flex flex-col relative">
      <h3 className="text-[12px] font-bold text-text-muted mb-4 absolute top-0 left-0">Assets vs Liabilities</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 25, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2E39" vertical={false} />
          <XAxis dataKey="name" stroke="#787B86" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => `$${formatLargeNumber(v)}`} stroke="#787B86" fontSize={11} tickLine={false} axisLine={false} width={60} />
          <Tooltip content={renderTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#787B86' }} />
          <Bar dataKey="assets" name="Total Assets" fill="#2196F3" radius={[2, 2, 0, 0]} />
          <Bar dataKey="liab" name="Total Liabilities" fill="#EF5350" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  const renderCashFlowChart = () => (
    <div className="w-full h-full flex flex-col relative">
      <h3 className="text-[12px] font-bold text-text-muted mb-4 absolute top-0 left-0">Operating vs Free Cash Flow</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 25, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2A2E39" vertical={false} />
          <XAxis dataKey="name" stroke="#787B86" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis tickFormatter={(v) => `$${formatLargeNumber(v)}`} stroke="#787B86" fontSize={11} tickLine={false} axisLine={false} width={60} />
          <Tooltip content={renderTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#787B86' }} />
          <Bar dataKey="ocf" name="Operating Cash Flow" fill="#9C27B0" radius={[2, 2, 0, 0]} />
          <Bar dataKey="fcf" name="Free Cash Flow" fill="#26A69A" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <div className="w-full h-full bg-bg-base">
      {tab === 'income' && renderIncomeChart()}
      {tab === 'balance' && renderBalanceChart()}
      {tab === 'cashflow' && renderCashFlowChart()}
    </div>
  );
}
