export default {
  devIndicators: { position: 'top-right' },
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
  transpilePackages: ['@copilot/types', '@copilot/decision-engine', '@copilot/orchestration'],
  async redirects() {
    return [
      { source: '/feed', destination: '/community', permanent: false },
      { source: '/trade', destination: '/simulator', permanent: false },
      { source: '/academy', destination: '/chat', permanent: false },
      { source: '/network', destination: '/channels', permanent: false },
    ];
  },
};
