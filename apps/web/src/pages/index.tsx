import type { GetServerSideProps } from 'next';
import { hasCompletedOnboarding } from '../server/community';

export const getServerSideProps: GetServerSideProps = async ({ req }) => ({
  redirect: { destination: hasCompletedOnboarding(req.cookies.kai_community) ? '/community' : '/verify-identity', permanent: false },
});

export default function Home() {
  return null;
}
