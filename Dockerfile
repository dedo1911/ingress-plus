# Build stage
FROM node:24 AS build

WORKDIR /ingress-plus
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile --ignore-scripts
COPY src src
COPY static static
COPY svelte.config.ts .
COPY vite.config.js .
RUN yarn build

# Deploy stage
FROM gcr.io/distroless/nodejs22-debian12
USER 65532
COPY --from=build /ingress-plus/build /ingress-plus
WORKDIR /ingress-plus
CMD ["index.js"]
