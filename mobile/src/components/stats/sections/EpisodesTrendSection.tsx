import { useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getAllEpisodeLogs } from '@/lib/episodes';
import { groupEpisodesByTrend, type TrendDataPoint } from '@/lib/stats';

type TrendPeriod = 'l7d' | 'l8w' | 'ly';

const TREND_OPTIONS: Array<{ value: TrendPeriod; label: string }> = [
  { value: 'l7d', label: 'L7D' },
  { value: 'l8w', label: 'L8W' },
  { value: 'ly', label: 'LY' },
];

export function EpisodesTrendSection() {
  const theme = useTheme();
  const [period, setPeriod] = useState<TrendPeriod>('l7d');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrendDataPoint[] | null>(null);

  // Fetch and group episode data
  useMemo(() => {
    const fetchTrendData = async () => {
      setLoading(true);
      try {
        // Fetch all historical logs (use high limit to get all data, not just recent 50)
        const logs = await getAllEpisodeLogs(10000);
        const grouped = groupEpisodesByTrend(logs, period);
        setData(grouped);
      } catch (error) {
        console.error('Failed to fetch trend data:', error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchTrendData();
  }, [period]);

  if (!data) {
    return (
      <View style={styles.section}>
        <ThemedText type="small" style={styles.sectionTitle}>
          EPISODES WATCHED TREND
        </ThemedText>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.accent} />
        </View>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.section}>
        <ThemedText type="small" style={styles.sectionTitle}>
          EPISODES WATCHED TREND
        </ThemedText>
        <View style={[styles.chartContainer, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="small" themeColor="textSecondary">
            No episode data available for this period
          </ThemedText>
        </View>
      </View>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      {
        data: data.map(d => d.count),
        color: () => theme.accent,
        strokeWidth: 2,
      },
    ],
  };

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - Spacing.sm * 2;

  return (
    <View style={styles.section}>
      <ThemedText type="small" style={styles.sectionTitle}>
        EPISODES WATCHED TREND
      </ThemedText>

      {/* Period buttons */}
      <View style={styles.periodButtons}>
        {TREND_OPTIONS.map((option) => (
          <Pressable
            key={option.value}
            onPress={() => setPeriod(option.value)}
            style={[
              styles.periodButton,
              {
                backgroundColor:
                  period === option.value ? theme.accent : theme.backgroundSelected,
              },
            ]}
          >
            <ThemedText
              type="small"
              themeColor={period === option.value ? 'accentText' : 'text'}
              style={{ fontWeight: '600' }}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {/* Chart */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <View style={[styles.chartContainer, { backgroundColor: theme.backgroundSelected }]}>
          <View style={{ marginLeft: -32, marginBottom: -10 }}>
            <LineChart
              data={chartData}
              width={chartWidth}
              height={220}
              chartConfig={{
                backgroundColor: theme.backgroundSelected,
                backgroundGradientFrom: theme.backgroundSelected,
                backgroundGradientTo: theme.backgroundSelected,
                decimalPlaces: 0,
                color: () => theme.border,
                labelColor: () => theme.text,
                style: {
                  borderRadius: Spacing.two,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: theme.accent,
                },
              }}
              bezier
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    opacity: 0.6,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  periodButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  chartContainer: {
    borderRadius: Spacing.two,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  loadingContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
