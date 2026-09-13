/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // pdfjs-dist has an optional Node-only dependency on the native `canvas`
    // package. We only ever run it in the browser, so stub it out to avoid
    // "Module not found: canvas" bundling warnings.
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
