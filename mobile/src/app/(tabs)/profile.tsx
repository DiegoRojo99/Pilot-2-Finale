import { PlaceholderScreen } from '@/components/placeholder-screen';

export default function ProfileScreen() {
  return (
    <PlaceholderScreen
      eyebrow="Account"
      title="Profile"
      description="Profile will handle session state, sign out, and the account deletion request flow."
      tasks={[
        'Connect mobile authentication and session restore.',
        'Add sign out once auth is working on device.',
        'Mirror the web account deletion request flow for compliance.',
      ]}
    />
  );
}