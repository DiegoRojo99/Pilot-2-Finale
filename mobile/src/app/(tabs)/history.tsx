import { AuthGate } from '@/components/auth/auth-gate';
import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function HistoryScreen() {
  return (
    <PlaceholderScreen eyebrow="Timeline" title="History" description="This screen will show watched episodes in reverse chronological order." tasks={[]}>
      <AuthGate title="Sign in to view history" description="Your watched episodes and notes are private to your account.">
        <PlaceholderScreen.Tasks
          tasks={[
            'Fetch watched episode logs from the existing episode endpoints.',
            'Group recent activity by date for quick scanning.',
            'Open an episode log so ratings and notes can be edited later.',
          ]}
        />
      </AuthGate>
    </PlaceholderScreen>
  );
}