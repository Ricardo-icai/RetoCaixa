import type { GetServerSideProps } from 'next';
import { hasCompletedOnboarding } from '../server/community';
import { mainTabs } from '../navigation/mainTabs';

export const getServerSideProps: GetServerSideProps = async ({ req }) => ({
  redirect: { destination: hasCompletedOnboarding(req.cookies.kai_community) ? mainTabs[0].path : '/verify-identity', permanent: false },
});

export default function Home() {
  return null;
}
