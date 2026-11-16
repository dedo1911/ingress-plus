# Build stage
FROM node:24 AS build

WORKDIR /ingress-plus
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile --ignore-scripts
COPY src src
COPY static static
COPY svelte.config.js .
COPY vite.config.js .
RUN yarn build

# Runtime dependencies. adapter-node bundles devDependencies into build/
# but leaves package.json "dependencies" as external imports, so they have
# to be installed next to it. Without this every page importing one of
# them (isomorphic-dompurify: /media/<id>, /bugs/new, /plugins) failed
# server-side with a 500.
FROM node:24 AS deps

WORKDIR /ingress-plus
COPY package.json .
COPY yarn.lock .
RUN yarn install --frozen-lockfile --production --ignore-scripts

# Deploy stage
FROM gcr.io/distroless/nodejs24-debian12
USER 65532
WORKDIR /ingress-plus
COPY --from=deps /ingress-plus/node_modules node_modules
COPY package.json .
COPY --from=build /ingress-plus/build .
CMD ["index.js"]
