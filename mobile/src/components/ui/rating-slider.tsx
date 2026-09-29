import { StyleSheet, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type RatingSliderProps = {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  displayValue?: string;
};

export function RatingSlider({
  value,
  onValueChange,
  min = 0,
  max = 10,
  step = 0.1,
  label,
  displayValue,
}: RatingSliderProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.header}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
            {label}
          </ThemedText>
          {displayValue && (
            <ThemedText style={[styles.value, { color: theme.text }]}>
              {displayValue}
            </ThemedText>
          )}
        </View>
      )}

      {/* Slider */}
      <View style={styles.sliderWrapper}>
        <Slider
          style={styles.slider}
          minimumValue={min}
          maximumValue={max}
          value={value}
          onValueChange={onValueChange}
          step={step}
          minimumTrackTintColor={theme.accent}
          maximumTrackTintColor={theme.border}
          thumbTintColor={theme.accent}
        />
      </View>

      {/* Scale labels with tick marks */}
      <View style={[styles.scaleLabels, { marginHorizontal: Spacing.md }]}>
        <ThemedText style={[styles.scaleLabel, { color: theme.textSecondary, marginRight: Spacing.md }]}>
          {min}
        </ThemedText>
        <View style={styles.tickMarksContainer}>
          {Array.from({ length: Math.floor(max - min) + 1 }, (_, i) => min + i).map((i) => (
            <View
              key={i}
              style={[
                styles.tickMark,
                {
                  backgroundColor: theme.border,
                  height: (i - min) % Math.floor((max - min) / 2) === 0 ? 8 : 4,
                },
              ]}
            />
          ))}
        </View>
        <ThemedText style={[styles.scaleLabel, { color: theme.textSecondary, marginLeft: Spacing.md }]}>
          {max}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  sliderWrapper: {
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -40,
  },
  scaleLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tickMarksContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 2,
    height: 12,
  },
  tickMark: {
    width: 1,
    opacity: 0.6,
  },
});
