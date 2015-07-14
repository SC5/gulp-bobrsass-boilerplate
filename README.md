# Gulp BoBrSASS Boilerplate
[![Build Status](https://travis-ci.org/SC5/gulp-bobrsass-boilerplate.png?branch=angularjs)](https://travis-ci.org/SC5/gulp-bobrsass-boilerplate.png?branch=master)

BoBrSASS is a modifiable boilerplate combining some of our common tools and
practices:
* Gulp for fast builds
* Browserify for bundling CommonJS modules
* SASS & Compass stylesheets
* Runs in background (watching changes), supports live reload
* Supports source maps for both JavaScript and SASS
* Spaces instead of tabs
* Headless protractor acceptance tests

## Installation

### Prerequisites

The latest version of BoBrSASS should work with recent versions of Ruby, SASS,
Compass and Git. Please check the correct versions, maintained in our
[Travis configuration](https://github.com/SC5/gulp-bobrsass-boilerplate/blob/master/.travis.yml).
If you insist on using an older version of dependencies, earlier versions of
the boilerplate may work.

For system level deps, install [Node.js](http://www.nodejs.org/) 0.10 or
later and [Ruby](https://www.ruby-lang.org/en/downloads/) 2.1 or later and
[Git](http://git-scm.com/). When using
[Git on Windows](http://msysgit.github.io/), remember to enable usage from
command prompt.

Clone the project and trigger installation of the project dependencies by

    > git clone https://github.com/SC5/gulp-bobrsass-boilerplate.git
    > npm install
    > npm run deps

If `deps` fails on Ruby gem dependencies, try updating rubygems as follows:

    > gem update --system

## Building

BoBrSASS uses Gulp internally, but you can use npm scripts to trigger them.
Build, test etc. tasks utilise npm development dependencies, so one should
set 'NODE_ENV' to something else than 'production' or install the npm
dependencies with a '--debug' flag. All the development dependencies are moved
into devDependencies to avoid slow installs of the actual released software.

### Debug and Release builds

    > npm install --debug       # to force development dependencies
    > npm run build             # to trigger bower install, build and tests
    > npm run build -- --debug  # to trigger bower install, debug build and tests

After this you should have a working, tested build in 'dist' directory.

### Watching for changes

To trigger **debug** build or other features, run the build with a combination
of the following flags:

    > npm run watch -- --debug  # to disable optimisations, turn on debugging
    > npm run watch -- --test   # to turn on tests when building
    > npm run watch -- --nolint # to disable linting

The above extra flags '-- [--<flag>]' syntax syntax only works for npm 2.0 or
later. If you have an earlier version of dislike the syntax, trigger the same
gulp tasks with your local Gulp installation:

    > npm install -g gulp       # to install Gulp CLI locally
    > gulp install
    > gulp build --debug
    > gulp watch --debug --test --nolint

To update your package version, you eventually want to do one of the following:

    > gulp bump --patch
    > gulp bump --minor
    > gulp bump --major
    > gulp bump # defaults to minor

## Running

### Running the Stub Server

The boilerplate includes a minimal stub [Express](http://expressjs.com/) server
in 'server/' directory. Its primary purpose is testing the frontend as part of
the build, but nothing blocks you from expanding it into a full-blown server.

    > npm start                 # to start the server through npm
    > node server               # to start the server

The server should respond your http requests on local port 8080.

### Running with Docker

Boilerplate also comes with Docker support. To have a minimal Docker image and
speed up the containerization, the whole app is built before the packaging, and
only the Node.js production dependencies get packaged. To build and run the
container, run:

    > npm run build             # to build the application in production mode
    > docker build -t bobrsass . # to build the Docker image with name "docker"
    > docker run -d -P bobrsass # to star the app

To access the service, check the dynamically allocated port
(for example: 0.0.0.0:49164->8080/tcp) and use it in browser URL

    > docker ps                 # --> http://localhost:49164/

Localhost works in Linux environment, but if you are using boot2docker, you need to use VM IP
instead. Check the IP and replace `localhost` with it:

    > boot2docker ip
    # --> http://192.168.59.103:49164/

### Live Reloading the Changes

Live reloading is enabled when running *gulp watch* in another window. Just
change any of your JavaScript or SASS files to trigger reload. The reload
monitors 'dist' directory and pushes the changes as needed.

##  Extending & Hacking

###  Project Layout

#### App

    src/             The client-side source code
    src/index.html   The HTML entry point, stub page
    src/app          Application source code
    src/app/main.js  The app JS entry point
    src/app/*/       Controllers, directives etc. submodules
    src/components   The 3rd party JS dependencies


####  Build System

    gulpfile.js         The Gulp build configuration
    bower.json          The Bower components
    .bowerrc            The Bower directory overrides
    package.json        The build level dependencies

### Build Results

    dist/               The build results (debug and release builds)

## Using BoBrSASS as an Upstream

Upgrading the boilerplate in your project may be tedious work. Once BoBrSASS
directory structure becomes stable (it might be already, but no guarantees!),
you can use it directly as an upstream (here with a name 'bobrsass').

    > git remote add -f bobrsass git@github.com:SC5/gulp-bobrsass-boilerplate.git

Now synchronizing with BoBrSASS becomes easier:

    > git pull bobrsass master

It is possible to use BoBrSASS as a subtree, too:

    > git subtree add --prefix client --squash git@github.com:SC5/gulp-bobrsass-boilerplate.git master --squash
    > git remote add -f bobrsass git@github.com:SC5/gulp-bobrsass-boilerplate.git
    > git fetch bobrsass master

Note that you need to use a recent version of git that supports subtrees.

The example pulls BoBrSASS master branch into 'client' subdirectory. The key here is to use
'--prefix client' to keep the boilerplate in its own subdirectory. Later on, sync by:

    > git subtree pull --prefix client bobrsass master

## Testing

Run tests with PhantomJS:

    > gulp test

Or in debug mode with chromedriver in a browser:

    > gulp test --debug

## TODO

Plase see project GitHub [issue tracker](https://github.com/SC5/gulp-bobrsass-boilerplate/issues).

## Release History

* 2014/02/12 - v0.1.0 - Initial commit (partially working stub)
* 2014/02/24 - v0.1.1 - Fix the build errors, update README
* 2014/05/08 - v0.2.0 - Update dependecies, add linting and plugin loader, update README
* 2014/05/09 - v0.3.0 - Add Protractor test framework, update README
* 2014/05/14 - v0.3.1 - Better linting
* 2014/08/01 - v0.4.0 - Clear separation of dev. and product dependencies
* 2014/10/20 - v0.5.0 - Migrate to Compass 1.0.1, sourcemaps, better linting, updated deps

## License

Copyright (c) 2015 [SC5](http://sc5.io/), licensed for users and contributors under MIT license.
https://github.com/sc5/grunt-bobrsass-boilerplate/blob/master/LICENSE-MIT


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/SC5/gulp-bobrsass-boilerplate/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
