# Use the official Node.js 14 image.
# https://hub.docker.com/_/node
FROM node:14

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application to the container image.
COPY . .

# Install production dependencies.
RUN npm install --only=production

# Run the web service on container startup.
CMD [ "npm", "start" ]