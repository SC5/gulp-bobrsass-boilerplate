FROM ubuntu:14.04
ENV PORT 8080
EXPOSE 8080
ENV PATH ./node_modules/gulp/bin:$PATH

# Install apps and dependencies
# NOTE: These steps depends highly on service in question
RUN apt-get update
RUN apt-get install -y nodejs npm git vim ruby1.9.3 ruby-sass ruby-compass
RUN ln -s /usr/bin/nodejs /usr/bin/node

# Run app as a custom user `app`
RUN useradd -m -d /app app
ADD . /app
WORKDIR /app
RUN chown -R app.app /app
USER app
ENV HOME /app
RUN npm install gulp
RUN ln -s /app/node_modules/gulp/bin/gulp.js /app/node_modules/gulp/bin/gulp
RUN npm install
RUN npm run-script build
# Default command to run service
CMD npm start