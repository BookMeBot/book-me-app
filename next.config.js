/** @type {import('next').NextConfig} */

const nextConfig = {
  /* config options here */
  reactStrictMode: true,
  publicRuntimeConfig: {
    dynamicEnvironmentId: process.env.DYNAMIC_ENVIRONMENT_ID,
  },
};

module.exports = nextConfig;
