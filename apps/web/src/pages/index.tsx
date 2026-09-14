export async function getServerSideProps() {
  return { redirect: { destination: '/community', permanent: false } };
}

export default function Home() {
  return null;
}
