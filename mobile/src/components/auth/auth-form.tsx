import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { useAuth } from '@/components/auth/auth-provider';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Spacing } from '@/constants/theme';

type AuthMode = 'login' | 'register';

export function AuthForm({ mode, onSwitchMode }: { mode: AuthMode; onSwitchMode: () => void }) {
  const auth = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';

  async function submit() {
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await auth.register({ name, email, password });
      } else {
        await auth.signIn({ email, password });
      }
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card style={styles.card}>
      <ThemedView type="backgroundElement" style={styles.copy}>
        <ThemedText type="subtitle">{isRegister ? 'Create your account' : 'Welcome back'}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {isRegister ? 'Start tracking every episode from pilot to finale.' : 'Sign in to continue your watch journey.'}
        </ThemedText>
      </ThemedView>

      {isRegister ? <FormField label="Name" value={name} onChangeText={setName} autoComplete="name" /> : null}
      <FormField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <FormField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete={isRegister ? 'new-password' : 'current-password'} />

      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}

      <Button label={isSubmitting ? 'Please wait...' : isRegister ? 'Create account' : 'Sign in'} disabled={isSubmitting} onPress={submit} />

      <Button label={isRegister ? 'I already have an account' : 'Create an account'} variant="secondary" onPress={onSwitchMode} disabled={isSubmitting} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
  },
  copy: {
    gap: Spacing.one,
  },
});