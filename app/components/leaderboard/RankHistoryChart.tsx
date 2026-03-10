'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Typography, Box } from '@mui/material';
import { useTranslations } from 'next-intl';

export interface RankHistoryChartProps {
  userHistories: {
    userId: string
    displayName: string
    data: { date: number; rank: number }[]
  }[]
  currentUserId: string
  startDate: number    // YYYYMMDD — X-axis left bound
  endDate: number      // YYYYMMDD — X-axis right bound
  totalUsers: number   // Y-axis domain max
  themeColor?: string
}

/**
 * Convert a YYYYMMDD integer to a Date object (local time).
 */
function yyyymmddToDate(d: number): Date {
  const year = Math.floor(d / 10000);
  const month = Math.floor((d % 10000) / 100) - 1;
  const day = d % 100;
  return new Date(year, month, day);
}

/**
 * Format a YYYYMMDD date for X-axis tick display: "DD MMM".
 */
function formatDateTick(value: number): string {
  const date = yyyymmddToDate(value);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

// Palette of colors for non-current users
const LINE_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F',
  '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#83a6ed',
];

export default function RankHistoryChart({
  userHistories,
  currentUserId,
  startDate,
  endDate,
  totalUsers,
  themeColor,
}: RankHistoryChartProps) {
  const t = useTranslations('groups.history');

  if (userHistories.length === 0) return null;

  // Build a unified list of all unique dates across all users (sorted asc)
  const allDates = Array.from(
    new Set(userHistories.flatMap((u) => u.data.map((d) => d.date)))
  ).sort((a, b) => a - b);

  // Transform into recharts data: [{ date, [userId]: rank, ... }]
  const chartData = allDates.map((date) => {
    const entry: Record<string, number | string> = { date };
    for (const user of userHistories) {
      const point = user.data.find((d) => d.date === date);
      if (point !== undefined) {
        entry[user.userId] = point.rank;
      }
    }
    return entry;
  });

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {t('rankChartTitle')}
      </Typography>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            type="number"
            domain={[startDate, endDate]}
            tickFormatter={formatDateTick}
            scale="time"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            domain={[1, totalUsers]}
            reversed={true}
            tickFormatter={(v: number) => `#${v}`}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            labelFormatter={(v) => formatDateTick(Number(v))}
            formatter={(value, name) => {
              const user = userHistories.find((u) => u.userId === name);
              return [`#${value}`, user?.displayName ?? name];
            }}
          />
          <Legend
            formatter={(value) => {
              const user = userHistories.find((u) => u.userId === value);
              return user?.displayName ?? value;
            }}
          />
          {userHistories.map((user, idx) => {
            const isCurrentUser = user.userId === currentUserId;
            const color = isCurrentUser
              ? (themeColor ?? '#1976d2')
              : LINE_COLORS[idx % LINE_COLORS.length];
            return (
              <Line
                key={user.userId}
                type="monotone"
                dataKey={user.userId}
                stroke={color}
                strokeWidth={isCurrentUser ? 3 : 2}
                dot={false}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
