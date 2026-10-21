
import { AuthForm } from '@/components/auth/auth-form';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useState } from 'react';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const theme = useTheme();
  
  return (
      <ScrollView
        style={[styles.scrollView, { backgroundColor: theme.background }]}
        contentContainerStyle={[styles.scrollContent]}>
        <View style={styles.authContainer}>
            <View style={styles.logoContainer}>
                <Image
                    source={require('@/assets/images/transparent-logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                    alt="App logo"
                />
            </View>

            <ThemedView type="backgroundElement" style={styles.authBottomContainer}>
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tab, mode === 'login' && styles.tabActive]}
                        onPress={() => setMode('login')}
                    >
                        <ThemedText
                            type="small"
                            themeColor={mode === 'login' ? 'text' : 'textSecondary'}
                            style={styles.tabLabel}
                        >
                            Sign in
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style={[styles.tab, mode === 'register' && styles.tabActive]}
                    onPress={() => setMode('register')}
                    >
                        <ThemedText
                            type="small"
                            themeColor={mode === 'register' ? 'text' : 'textSecondary'}
                            style={styles.tabLabel}
                        >
                            Create account
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.formWrapper}>
                    <AuthForm mode={mode} />
                </View>
            </ThemedView>
        </View>
      </ScrollView>
  );
}    

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: 'space-between',
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingTop: Spacing.four,
  },
  logo: {
    width: 182,
    height: 182,
  },
  authBottomContainer: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#000',
  },
  tabLabel: {
    fontWeight: '600',
  },
  formWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.four,
  },
  header: {
    gap: Spacing.two,
  },
  description: {
    lineHeight: 20,
  },
  centerCard: {
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
});