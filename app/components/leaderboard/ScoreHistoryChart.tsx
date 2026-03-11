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
import { Typography, Box, Paper, useTheme } from '@mui/material';
import { useTranslations } from 'next-intl';

export interface ScoreHistoryChartProps {
  userHistories: {
    userId: string
    displayName: string
    data: { date: number; totalPoints: number }[]
  }[]
  currentUserId: string
  startDate: number
  endDate: number
  themeColor?: string
}

function yyyymmddToMs(d: number): number {
  const year = Math.floor(d / 10000);
  const month = Math.floor((d % 10000) / 100) - 1;
  const day = d % 100;
  return new Date(year, month, day).getTime();
}

function formatDateTick(value: number): string {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

const LINE_COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00C49F',
  '#FFBB28', '#FF8042', '#a4de6c', '#d0ed57', '#83a6ed',
];

interface TooltipProps {
  active?: boolean
  payload?: Array<{ dataKey: string; value: number }>
  label?: number
  currentUserId: string
  userHistories: ScoreHistoryChartProps['userHistories']
}

function ScoreTooltip({ active, payload, label, currentUserId, userHistories }: TooltipProps) {
  if (!active || !payload || label === undefined) return null;
  const myEntry = payload.find((p) => p.dataKey === currentUserId);
  if (!myEntry) return null;
  const me = userHistories.find((u) => u.userId === currentUserId);
  return (
    <Paper elevation={3} sx={{ px: 1.5, py: 1, minWidth: 120 }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {formatDateTick(label)}
      </Typography>
      <Typography variant="body2" fontWeight="bold">
        {me?.displayName ?? currentUserId}: {myEntry.value} pts
      </Typography>
    </Paper>
  );
}

export default function ScoreHistoryChart({
  userHistories,
  currentUserId,
  startDate,
  endDate,
  themeColor,
}: ScoreHistoryChartProps) {
  const t = useTranslations('groups.history');
  const theme = useTheme();

  if (userHistories.length === 0) return null;

  const allDates = Array.from(
    new Set(userHistories.flatMap((u) => u.data.map((d) => d.date)))
  ).sort((a, b) => a - b);

  const chartData = allDates.map((date) => {
    const entry: Record<string, number> = { date: yyyymmddToMs(date) };
    for (const user of userHistories) {
      const point = user.data.find((d) => d.date === date);
      if (point !== undefined) entry[user.userId] = point.totalPoints;
    }
    return entry;
  });

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        {t('totalPointsChartTitle')}
      </Typography>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="date"
            type="number"
            domain={[yyyymmddToMs(startDate), yyyymmddToMs(endDate)]}
            tickFormatter={formatDateTick}
            scale="time"
            tick={{ fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip
            content={(props) => (
              <ScoreTooltip
                {...props}
                currentUserId={currentUserId}
                userHistories={userHistories}
              />
            )}
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
