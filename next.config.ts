import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit liest Schriftdaten zur Laufzeit aus node_modules und darf
  // deshalb nicht vom Bundler eingepackt werden
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
