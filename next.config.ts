import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pino usa worker threads para transports; precisa rodar fora do bundle do servidor.
  serverExternalPackages: ["pino", "pino-pretty"],
};

export default nextConfig;
