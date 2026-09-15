import type { AppProps } from 'next/app';
import '../styles/globals.css';
import { BottomNavBar } from '../components/BottomNavBar';

export default function App({ Component, pageProps }: AppProps) {
  return <>
    <div className="min-h-screen pb-16"><Component {...pageProps} /></div>
    <BottomNavBar />
  </>;
}
