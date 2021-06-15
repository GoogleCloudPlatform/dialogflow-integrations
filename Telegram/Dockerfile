# Use the official Node.js 10 image.
# https://hub.docker.com/_/node
FROM node:10



# Create and change to the app directory.
WORKDIR /usr/src/app

COPY . .

# Install production dependencies.
RUN npm install --only=production

# Copy local code to the container image.



# Run the web service on container startup.

CMD [ "npm", "start" ]

