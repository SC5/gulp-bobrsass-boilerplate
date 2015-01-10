FROM node:0.10-slim
ENV PORT 8080
EXPOSE 8080
ENV NODE_ENV production

# Install app dependencies
# NOTE: These steps depends highly on service in question

# Switch to non-root user and create a directory for it
RUN useradd -m -d /app app
RUN mkdir -p /app
RUN chown -R app.app /app
USER app

# Install and package production deps; see the extensive 
# file ignore list at .dockerignore
WORKDIR /app
COPY package.json /app/
COPY README.md /app/ 
RUN npm install --production
COPY . /app

# Use the start script defined in package.json
CMD [ "npm", "start" ]