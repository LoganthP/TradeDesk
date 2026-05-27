import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, AlertCircle, LineChart, Palette, Settings, Trash2, User } from 'lucide-react';
import { PortfolioManager } from '@/components/portfolio/PortfolioManager';
import { useAuth } from '@/store/useAuth';
import { usePortfolioStore } from '@/store/usePortfolioStore';
import { useSettings } from '@/store/useSettings';
import { useToast } from '@/store/useToast';
import { STARTING_BALANCES } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { activePortfolioId, activePortfolio, resetPortfolio } = usePortfolioStore();
  const settings = useSettings();
  const { addToast } = useToast();
  const [resetBalance, setResetBalance] = useState(100_000);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReset = () => {
    if (!activePortfolioId) return;
    resetPortfolio(activePortfolioId, resetBalance);
    addToast({ type: 'success', title: 'Portfolio Reset' });
  };

  return (
    <div className="w-full h-full p-8 overflow-y-auto max-w-7xl mx-auto flex flex-col gap-6">
      <div className="flex items-center justify-between pb-4 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue/10 flex items-center justify-center">
            <Settings className="w-5 h-5 text-blue" />
          </div>
          <div>
            <h1 className="text-[20px] font-bold text-text-primary tracking-tight">Settings & Preferences</h1>
            <p className="text-[13px] text-text-muted">Manage your workspace, portfolios, and trading defaults</p>
          </div>
        </div>
        <button onClick={() => navigate('/dashboard')} className="tv-button px-4 py-2 bg-bg-surface border border-border-primary text-text-primary">
          Back to Chart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <section className="bg-bg-surface border border-border-primary rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5 text-text-primary" />
              <h2 className="text-[15px] font-bold text-text-primary">Appearance</h2>
            </div>

            <div className="flex flex-col gap-4">
              <SettingSelect
                label="Theme"
                value={settings.theme}
                onChange={(value) => settings.updateSetting('theme', value as 'dark' | 'light')}
                options={[
                  ['dark', 'Dark'],
                  ['light', 'Light'],
                ]}
              />
              <SettingSelect
                label="Font Size"
                value={settings.fontSize}
                onChange={(value) => settings.updateSetting('fontSize', value as 'small' | 'medium' | 'large')}
                options={[
                  ['small', 'Small'],
                  ['medium', 'Medium'],
                  ['large', 'Large'],
                ]}
              />
            </div>
          </section>

          <section className="bg-bg-surface border border-border-primary rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <LineChart className="w-5 h-5 text-text-primary" />
              <h2 className="text-[15px] font-bold text-text-primary">Chart Settings</h2>
            </div>

            <div className="flex flex-col gap-4">
              <SettingSelect
                label="Candle Colors"
                value={settings.candleColors}
                onChange={(value) => settings.updateSetting('candleColors', value as 'default' | 'monochrome' | 'neon')}
                options={[
                  ['default', 'Green / Red'],
                  ['monochrome', 'White / Black'],
                  ['neon', 'Neon Cyan / Pink'],
                ]}
              />
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-text-primary">Grid Lines</span>
                <input
                  type="checkbox"
                  checked={settings.gridLines}
                  onChange={(event) => settings.updateSetting('gridLines', event.target.checked)}
                  className="w-4 h-4 accent-blue"
                />
              </div>
              <SettingSelect
                label="Crosshair Style"
                value={settings.crosshairStyle}
                onChange={(value) => settings.updateSetting('crosshairStyle', value as 'dashed' | 'dotted' | 'solid')}
                options={[
                  ['dashed', 'Dashed'],
                  ['dotted', 'Dotted'],
                  ['solid', 'Solid'],
                ]}
              />
            </div>
          </section>

          <section className="bg-bg-surface border border-border-primary rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-text-primary" />
              <h2 className="text-[15px] font-bold text-text-primary">Trading Settings</h2>
            </div>

            <div className="flex flex-col gap-4">
              <SettingSelect
                label="Default Order Type"
                value={settings.defaultOrderType}
                onChange={(value) => settings.updateSetting('defaultOrderType', value as 'market' | 'limit')}
                options={[
                  ['market', 'Market'],
                  ['limit', 'Limit'],
                ]}
              />
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-text-primary">Order Confirmation</span>
                <input
                  type="checkbox"
                  checked={settings.confirmOrders}
                  onChange={(event) => settings.updateSetting('confirmOrders', event.target.checked)}
                  className="w-4 h-4 accent-blue"
                />
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section className="bg-bg-surface border border-border-primary rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-text-primary" />
              <h2 className="text-[15px] font-bold text-text-primary">Account</h2>
            </div>

            <div className="flex flex-col gap-4">
              <AccountRow label="Display Name" value={user?.displayName || '-'} />
              <AccountRow label="Email" value={user?.email || '-'} />
              <div className="flex justify-between items-center py-2">
                <span className="text-[13px] text-text-muted">Account type</span>
                <span className="px-2 py-0.5 rounded bg-blue/10 text-blue text-[11px] font-bold uppercase tracking-wider">Paper Trader</span>
              </div>
              <button
                onClick={handleLogout}
                className="mt-2 w-full py-2.5 rounded border border-red/30 text-red text-[13px] font-medium hover:bg-red/10 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </section>

          <PortfolioManager />

          <section className="bg-bg-surface border border-red/30 rounded-xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red" />
            <div className="flex items-center gap-2 mb-2 pl-2">
              <AlertCircle className="w-5 h-5 text-red" />
              <h2 className="text-[15px] font-bold text-text-primary">Reset Active Portfolio</h2>
            </div>

            <p className="text-[12px] text-text-muted mb-5 pl-2 leading-relaxed">
              Erases all positions, orders, and trade history for the active portfolio. The cash balance will be reset to the selected starting amount.
            </p>

            {activePortfolio ? (
              <div className="flex flex-col gap-3 pl-2">
                <div className="flex items-center justify-between p-3 rounded bg-bg-base border border-border-primary">
                  <span className="text-[13px] text-text-muted">
                    Target: <strong className="text-text-primary font-medium">{activePortfolio.name}</strong>
                  </span>
                </div>

                <div className="flex gap-2">
                  <select
                    value={resetBalance}
                    onChange={(event) => setResetBalance(Number(event.target.value))}
                    className="h-9 px-3 text-[13px] bg-bg-elevated border border-border-subtle rounded focus:border-border-focus outline-none font-mono-numbers flex-1"
                  >
                    {STARTING_BALANCES.map((balance) => (
                      <option key={balance} value={balance}>{formatCurrency(balance)}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => {
                      if (window.confirm(`Reset "${activePortfolio.name}" portfolio? All history will be deleted.`)) {
                        handleReset();
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-2 rounded bg-red/10 text-[13px] font-bold border border-red/30 text-red hover:bg-red hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-text-muted pl-2">Select a portfolio to reset it.</p>
            )}
          </section>

          <section className="bg-bg-surface border border-border-primary rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-5 h-5 text-text-primary" />
              <h2 className="text-[15px] font-bold text-text-primary">Keyboard Shortcuts</h2>
            </div>

            <div className="flex flex-col gap-4">
              <Shortcut label="Market Buy" keys="Shift + B" />
              <Shortcut label="Market Sell" keys="Shift + S" />
              <Shortcut label="Close All Positions" keys="Ctrl + Shift + X" />
              <Shortcut label="Cancel All Orders" keys="Ctrl + Shift + C" last />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-medium text-text-primary">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-bg-elevated border border-border-subtle rounded px-3 py-1.5 text-[13px] text-text-primary w-40"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </div>
  );
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border-primary/50">
      <span className="text-[13px] text-text-muted">{label}</span>
      <span className="text-[13px] font-medium text-text-primary">{value}</span>
    </div>
  );
}

function Shortcut({ label, keys, last }: { label: string; keys: string; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-2 ${last ? '' : 'border-b border-border-primary/50'}`}>
      <span className="text-[13px] text-text-primary">{label}</span>
      <kbd className="px-2 py-1 bg-bg-elevated border border-border-subtle rounded text-[11px] font-mono text-text-muted">
        {keys}
      </kbd>
    </div>
  );
}
