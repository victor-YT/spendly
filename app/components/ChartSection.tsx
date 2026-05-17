"use client";

import { useMemo, useState } from "react";
import type { Expense } from "@/lib/expense-utils";
import { formatCurrency } from "@/lib/expense-utils";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ChartSectionProps = {
  expenses: Expense[];
};

type CategoryDatum = {
  name: string;
  value: number;
  color: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#2563eb",
  Healthcare: "#14b8a6",
  Transport: "#7c3aed",
  Housing: "#4f46e5",
  Utilities: "#0ea5e9",
  Entertainment: "#f97316",
  Shopping: "#e11d48",
  Travel: "#0891b2",
  Education: "#6366f1",
  Other: "#f59e0b",
};

const FALLBACK_COLORS = [
  "#2563eb",
  "#14b8a6",
  "#7c3aed",
  "#4f46e5",
  "#0ea5e9",
  "#f97316",
  "#e11d48",
  "#0891b2",
  "#6366f1",
  "#f59e0b",
];

export default function ChartSection({ expenses }: ChartSectionProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPieAnimating, setIsPieAnimating] = useState(true);

  const categoryData = useMemo<CategoryDatum[]>(() => {
    const categoryMap = expenses.reduce<Record<string, number>>((summary, expense) => {
      summary[expense.category] = (summary[expense.category] ?? 0) + expense.amount;
      return summary;
    }, {});

    return Object.entries(categoryMap)
      .map(([name, value], index) => ({
        name,
        value: Number(value.toFixed(2)),
        color:
          CATEGORY_COLORS[name] ??
          FALLBACK_COLORS[index % FALLBACK_COLORS.length],
      }))
      .sort((left, right) => right.value - left.value);
  }, [expenses]);

  const dailyData = useMemo(() => {
    const dailyMap = expenses.reduce<Record<string, number>>((summary, expense) => {
      summary[expense.date] = (summary[expense.date] ?? 0) + expense.amount;
      return summary;
    }, {});

    return Object.entries(dailyMap)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([day, total]) => ({
        day: new Intl.DateTimeFormat("en-AU", {
          day: "numeric",
          month: "short",
        }).format(new Date(`${day}T00:00:00`)),
        total: Number(total.toFixed(2)),
      }));
  }, [expenses]);

  const activeCategory =
    activeIndex !== null && categoryData[activeIndex]
      ? categoryData[activeIndex]
      : null;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Spending by Category
          </h2>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex h-[296px] flex-col [&_.recharts-layer:focus]:outline-none [&_.recharts-sector:focus]:outline-none [&_.recharts-surface:focus]:outline-none">
              <div
                className={`mb-2 min-h-5 text-center text-sm font-medium transition-all duration-200 ease-out ${
                  activeCategory
                    ? "translate-y-0 opacity-100"
                    : "-translate-y-1 opacity-0"
                }`}
                style={{ color: activeCategory?.color ?? "#64748b" }}
              >
                {activeCategory
                  ? `${activeCategory.name} · ${formatCurrency(activeCategory.value)}`
                  : ""}
              </div>

              <div className="h-[272px]">
              {categoryData.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
                  No expenses yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={70}
                      outerRadius={108}
                      paddingAngle={2}
                      onMouseEnter={(_, index) => {
                        if (!isPieAnimating) {
                          setActiveIndex(index);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isPieAnimating) {
                          setActiveIndex(null);
                        }
                      }}
                      isAnimationActive
                      onAnimationEnd={() => setIsPieAnimating(false)}
                    >
                      {categoryData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={() => null} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              </div>
            </div>
          </div>

          {categoryData.length > 0 ? (
            <div className="min-w-0 lg:w-64">
              <div className="space-y-2">
                {categoryData.map((item, index) => {
                  const isActive = index === activeIndex;

                  return (
                    <div
                      key={item.name}
                      className={`flex items-center justify-between gap-4 rounded-lg px-1 py-1 transition-colors duration-200 ${
                        isActive ? "bg-slate-50" : ""
                      }`}
                      onMouseEnter={() => {
                        if (!isPieAnimating) {
                          setActiveIndex(index);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!isPieAnimating) {
                          setActiveIndex(null);
                        }
                      }}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className="truncate text-sm"
                          style={{ color: isActive ? item.color : "#334155" }}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: isActive ? item.color : "#0f172a" }}
                      >
                        {formatCurrency(item.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="mb-6">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950">
            Daily Spending
          </h2>
        </div>

        <div className="h-[300px] [&_.recharts-layer:focus]:outline-none [&_.recharts-dot:focus]:outline-none [&_.recharts-surface:focus]:outline-none">
          {dailyData.length === 0 ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              No expenses yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyData}
                margin={{ top: 8, right: 8, left: 12, bottom: 0 }}
              >
                <CartesianGrid
                  stroke="#e5e7eb"
                  strokeDasharray="2 4"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  width={56}
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => `$${value}`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value ?? 0))}
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.10)",
                  }}
                  wrapperStyle={{ outline: "none" }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}
