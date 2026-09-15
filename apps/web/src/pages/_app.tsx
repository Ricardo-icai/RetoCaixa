import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { BottomNavBar } from '../components/BottomNavBar';
import { OnboardingTutorial } from '../components/OnboardingTutorial';
import { SwipeNavigation } from '../components/SwipeNavigation';

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <SwipeNavigation><div className="min-h-screen pb-16"><Component {...pageProps} /></div></SwipeNavigation>
    <BottomNavBar />
    <OnboardingTutorial />
  </>;
}
