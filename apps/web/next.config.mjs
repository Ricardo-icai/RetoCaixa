export default { distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next', transpilePackages: ['@copilot/types', '@copilot/decision-engine'] };
