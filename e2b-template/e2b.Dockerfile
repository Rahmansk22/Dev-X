FROM node:20-slim

# System deps
RUN apt-get update && \
    apt-get install -y curl procps net-tools && \
    rm -rf /var/lib/apt/lists/*

# Create workspace aligned with the app runtime path
RUN mkdir -p /home/user /tmp/devx-workspace && \
    ln -sfn /tmp/devx-workspace /home/user/workspace
WORKDIR /tmp/devx-workspace

# Pre-install ALL common dependencies so sandbox never needs npm install
COPY package.json /tmp/devx-workspace/package.json
RUN npm install --legacy-peer-deps --no-audit --no-fund && \
    npm cache clean --force

# Pre-create common config files
RUN echo '/** @type {import("next").NextConfig} */\nconst nextConfig = { typescript: { ignoreBuildErrors: true }, eslint: { ignoreDuringBuilds: true } };\nexport default nextConfig;' > /tmp/devx-workspace/next.config.mjs

RUN echo '{ "compilerOptions": { "target": "es5", "lib": ["dom","dom.iterable","esnext"], "allowJs": true, "skipLibCheck": true, "strict": false, "noEmit": true, "esModuleInterop": true, "module": "esnext", "moduleResolution": "bundler", "resolveJsonModule": true, "isolatedModules": true, "jsx": "preserve", "incremental": true, "plugins": [{"name":"next"}], "paths": {"@/*":["./*"]} }, "include": ["next-env.d.ts","**/*.ts","**/*.tsx",".next/types/**/*.ts"], "exclude": ["node_modules"] }' > /tmp/devx-workspace/tsconfig.json

RUN echo 'export default { plugins: { "@tailwindcss/postcss": {} } };' > /tmp/devx-workspace/postcss.config.mjs

# Pre-create app directory
RUN mkdir -p /tmp/devx-workspace/app
