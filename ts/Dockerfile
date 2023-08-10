ARG NODE_VERSION=18
ARG BUILD_IMAGE=node:${NODE_VERSION}-bullseye-slim
ARG RUN_IMAGE=gcr.io/distroless/nodejs${NODE_VERSION}-debian11

# Setup build environment
FROM $BUILD_IMAGE AS build
ARG INTEGRATION
WORKDIR /app
# Copy and install packages separately to optimize for layer cache
COPY package*.json ./
RUN npm pkg delete scripts.prepare && \
    npm ci
# Build Typescript sources and copy .env file
COPY . .
RUN npm run compile && \
    cp src/${INTEGRATION}/.env /app/build/src/${INTEGRATION}
# Remove build dependencies
RUN NODE_ENV=production npm prune

# Setup runtime container environment
FROM $RUN_IMAGE
ARG INTEGRATION
ARG GCP_PROJECT
ENV GCP_PROJECT $GCP_PROJECT
# Copy app files from build environment
COPY --from=build /app /app
# Run integration server
WORKDIR /app/build/src/${INTEGRATION}
ENV NODE_ENV production
CMD ["index.js"]
