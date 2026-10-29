import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Sliders, AlertTriangle, TrendingDown, Edit2, Check, RotateCcw, ShieldCheck, DollarSign } from 'lucide-react';
import { BudgetSummary, BudgetLine } from '../../types';
import { rescaleBudgetLines } from '../../lib/math';

interface BudgetTabProps {
  budget: BudgetSummary;
  currency: string;
  guestsCount: number;
  initialTotalBudget: number;
  onUpdateBudget: (newBudget: BudgetSummary) => void;
  isReadOnly?: boolean;
}

const COLORS = ['#4A154B', '#FF6B6B', '#7E22CE', '#F43F5E', '#C2A35C', '#3B82F6', '#10B981', '#F59E0B'];

export const BudgetTab: React.FC<BudgetTabProps> = ({
  budget,
  currency,
  guestsCount,
  initialTotalBudget,
  onUpdateBudget,
  isReadOnly,
}) => {
  const [sliderBudget, setSliderBudget] = useState<number>(budget.totalBudget);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ allocated: number; actual: number }>({ allocated: 0, actual: 0 });
  const [showCheaperOnly, setShowCheaperOnly] = useState<boolean>(false);

  // Instant code-side what-if slider handler
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    setSliderBudget(val);
    const updated = rescaleBudgetLines(budget.lines, val);
    onUpdateBudget(updated);
  };

  const handleResetBudget = () => {
    setSliderBudget(initialTotalBudget);
    const updated = rescaleBudgetLines(budget.lines, initialTotalBudget);
    onUpdateBudget(updated);
  };

  const startEditing = (line: BudgetLine) => {
    if (isReadOnly) return;
    setEditingLineId(line.id);
    setEditValues({ allocated: line.allocatedAmount, actual: line.actualAmount });
  };

  const saveEditing = (lineId: string) => {
    const updatedLines = budget.lines.map((line) => {
      if (line.id === lineId) {
        return {
          ...line,
          allocatedAmount: Math.max(0, editValues.allocated),
          actualAmount: Math.max(0, editValues.actual),
        };
      }
      return line;
    });

    const updated = rescaleBudgetLines(updatedLines, budget.totalBudget);
    onUpdateBudget(updated);
    setEditingLineId(null);
  };

  const applyCheaperSaving = (lineId: string) => {
    if (isReadOnly) return;
    const updatedLines = budget.lines.map((line) => {
      if (line.id === lineId && line.isCheaperAlternativeAvailable) {
        const newAllocated = Math.max(0, line.allocatedAmount - line.potentialSavings);
        return {
          ...line,
          allocatedAmount: newAllocated,
        };
      }
      return line;
    });

    const updated = rescaleBudgetLines(updatedLines, budget.totalBudget);
    onUpdateBudget(updated);
  };

  // Chart data
  const chartData = budget.lines.map((l) => ({
    name: l.category,
    value: l.allocatedAmount,
    actual: l.actualAmount,
    percentage: l.percentage,
  }));

  const totalPotentialSavings = budget.lines.reduce(
    (acc, l) => acc + (l.isCheaperAlternativeAvailable ? l.potentialSavings : 0),
    0
  );

  const displayedLines = showCheaperOnly
    ? budget.lines.filter((l) => l.isCheaperAlternativeAvailable)
    : budget.lines;

  const minRange = Math.round(initialTotalBudget * 0.4);
  const maxRange = Math.round(initialTotalBudget * 2.5);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* What-If Simulation Bar */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white to-ivory-200 border border-ivory-300 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-plum-100 flex items-center justify-center text-plum-900">
              <Sliders className="w-5 h-5 text-plum-800" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-xl text-plum-950">Budget What-If Simulator</h3>
              <p className="text-xs text-stone-700">
                Instant code-side recalculation without calling AI. Rescales all lines perfectly to the total.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetBudget}
              disabled={isReadOnly}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-ivory-200 border border-ivory-300 rounded-lg transition-colors"
              title="Reset to initial budget"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <div className="px-3.5 py-1.5 rounded-xl bg-plum-900 text-white font-mono font-bold text-sm">
              {currency} {sliderBudget.toLocaleString()}
            </div>
          </div>
        </div>

        {/* The Range Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-stone-700">
            <span>{currency} {minRange.toLocaleString()} (-60%)</span>
            <span className="text-plum-950 font-bold">Slide to test higher/lower budget</span>
            <span>{currency} {maxRange.toLocaleString()} (+150%)</span>
          </div>

          <input
            type="range"
            min={minRange}
            max={maxRange}
            step="1000"
            disabled={isReadOnly}
            value={sliderBudget}
            onChange={handleSliderChange}
            aria-label="Budget what-if slider"
            className="w-full h-2.5 bg-ivory-300 rounded-lg appearance-none cursor-pointer accent-coral-600 focus:outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs text-stone-700 pt-2 border-t border-ivory-300 gap-2">
          <span>Cost Per Head at Current Target: <strong className="text-plum-950 font-semibold">{currency} {Math.round(budget.totalBudget / Math.max(1, guestsCount)).toLocaleString()} / guest</strong></span>
          <span className="text-emerald-700 font-medium">✓ Mathematical precision: Lines sum exactly to {currency} {budget.totalAllocated.toLocaleString()}</span>
        </div>
      </div>

      {/* Warnings & Advisories */}
      {budget.warnings.length > 0 && (
        <div className="space-y-2">
          {budget.warnings.map((warn, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl flex items-start gap-3 text-xs ${
                warn.includes('exceeds')
                  ? 'bg-rose-50 border border-rose-200 text-rose-900'
                  : 'bg-amber-50 border border-amber-200 text-amber-900'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${warn.includes('exceeds') ? 'text-rose-600' : 'text-amber-600'}`} />
              <div>
                <strong className="font-semibold">{warn.includes('exceeds') ? 'Over-Budget Alert: ' : 'Advisory: '}</strong>
                {warn}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-ivory-300 shadow-soft">
          <span className="text-xs text-stone-700 font-medium block">Total Planned</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-plum-950 mt-1">
            {currency} {budget.totalAllocated.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-700">100% of target</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-ivory-300 shadow-soft">
          <span className="text-xs text-stone-700 font-medium block">Actual Incurred</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-stone-900 mt-1">
            {currency} {budget.totalActual.toLocaleString()}
          </p>
          <span className={`text-[11px] font-semibold ${budget.isOverBudget ? 'text-rose-600' : 'text-emerald-600'}`}>
            {budget.isOverBudget ? `Over by ${currency} ${budget.overBudgetAmount.toLocaleString()}` : 'Under limit'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-ivory-300 shadow-soft">
          <span className="text-xs text-stone-700 font-medium block">Remaining Buffer</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-emerald-800 mt-1">
            {currency} {budget.remainingBudget.toLocaleString()}
          </p>
          <span className="text-[11px] text-stone-700">Unspent funds</span>
        </div>

        <div className="p-4 rounded-2xl bg-coral-50/60 border border-coral-200 shadow-soft">
          <span className="text-xs text-coral-800 font-medium block">Potential Savings</span>
          <p className="text-lg sm:text-xl font-bold font-mono text-coral-800 mt-1">
            {currency} {totalPotentialSavings.toLocaleString()}
          </p>
          <span className="text-[11px] text-coral-800 font-medium">via cheaper alternatives</span>
        </div>
      </div>

      {/* Visual Analytics: Pie Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-ivory-300 shadow-soft">
          <h4 className="font-serif font-bold text-base text-plum-950 mb-4">Category Allocations</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`${currency} ${val.toLocaleString()}`, 'Allocated']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {chartData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 text-[11px] text-stone-700">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span>{entry.name} ({entry.percentage}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actual vs Allocated Comparison */}
        <div className="p-6 rounded-3xl bg-white border border-ivory-300 shadow-soft">
          <h4 className="font-serif font-bold text-base text-plum-950 mb-4">Planned vs Incurred Spend</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EFE8DE" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#78716C' }} interval={0} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10, fill: '#78716C' }} />
                <Tooltip formatter={(val: number) => [`${currency} ${val.toLocaleString()}`]} />
                <Bar dataKey="value" name="Planned" fill="#581C87" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" name="Actual Incurred" fill="#FF6B6B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Editable Table */}
      <div className="bg-white rounded-3xl border border-ivory-300 shadow-soft overflow-hidden">
        <div className="p-6 border-b border-ivory-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-serif font-bold text-lg text-plum-950">Detailed Budget Lines</h4>
            <p className="text-xs text-stone-700">Edit allocated or actual expenses inline to trigger dynamic re-calculations</p>
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={showCheaperOnly}
              onChange={(e) => setShowCheaperOnly(e.target.checked)}
              className="rounded text-coral-600 focus:ring-coral-500"
            />
            <span>Show Only Lines with Cheaper Alternatives ({totalPotentialSavings > 0 ? `${currency} ${totalPotentialSavings.toLocaleString()} savings` : 'None'})</span>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory-100 text-stone-700 uppercase font-semibold border-b border-ivory-300">
              <tr>
                <th className="px-5 py-3">Category & Scope</th>
                <th className="px-4 py-3">Share</th>
                <th className="px-4 py-3">Planned ({currency})</th>
                <th className="px-4 py-3">Actual Incurred ({currency})</th>
                <th className="px-4 py-3">Cheaper Alternative</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-200">
              {displayedLines.map((line) => {
                const isEditing = editingLineId === line.id;

                return (
                  <tr key={line.id} className="hover:bg-ivory-50/80 transition-colors">
                    {/* Category */}
                    <td className="px-5 py-4">
                      <span className="font-bold text-plum-950 block text-xs sm:text-sm">{line.category}</span>
                      <span className="text-stone-700 text-xs block">{line.item}</span>
                    </td>

                    {/* Percentage */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-plum-100 text-plum-900">
                        {line.percentage}%
                      </span>
                    </td>

                    {/* Planned Allocation */}
                    <td className="px-4 py-4 whitespace-nowrap font-mono font-medium">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.allocated}
                          onChange={(e) => setEditValues({ ...editValues, allocated: parseInt(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 text-xs border rounded border-coral-500 focus:outline-hidden"
                        />
                      ) : (
                        <span>{currency} {line.allocatedAmount.toLocaleString()}</span>
                      )}
                    </td>

                    {/* Actual Incurred */}
                    <td className="px-4 py-4 whitespace-nowrap font-mono">
                      {isEditing ? (
                        <input
                          type="number"
                          value={editValues.actual}
                          onChange={(e) => setEditValues({ ...editValues, actual: parseInt(e.target.value) || 0 })}
                          className="w-24 px-2 py-1 text-xs border rounded border-coral-500 focus:outline-hidden"
                        />
                      ) : (
                        <span className={line.actualAmount > line.allocatedAmount ? 'text-rose-600 font-semibold' : 'text-stone-800'}>
                          {currency} {line.actualAmount.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Cheaper Alternative Option */}
                    <td className="px-4 py-4 max-w-xs">
                      {line.isCheaperAlternativeAvailable ? (
                        <div className="space-y-1">
                          <p className="text-[11px] text-emerald-800 leading-tight">
                            {line.cheaperAlternativeNote}
                          </p>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                            Save ~{currency} {line.potentialSavings.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-stone-700 text-[11px] italic">Optimized</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      {!isReadOnly && (
                        <div className="flex items-center justify-end gap-2">
                          {isEditing ? (
                            <button
                              onClick={() => saveEditing(line.id)}
                              type="button"
                              className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                              title="Save edits"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => startEditing(line)}
                              type="button"
                              className="p-1 rounded text-stone-600 hover:text-plum-900 hover:bg-ivory-200 transition-colors"
                              title="Edit line"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {line.isCheaperAlternativeAvailable && !isEditing && (
                            <button
                              onClick={() => applyCheaperSaving(line.id)}
                              type="button"
                              className="px-2 py-1 rounded text-[11px] font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                              title="Apply cheaper alternative reduction"
                            >
                              Apply -{currency}{line.potentialSavings}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

