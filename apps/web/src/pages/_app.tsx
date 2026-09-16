import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { AppShell } from '../components/AppShell';
import { OnboardingTutorial } from '../components/OnboardingTutorial';

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <AppShell><Component {...pageProps} /></AppShell>
    <OnboardingTutorial />
  </>;
}
