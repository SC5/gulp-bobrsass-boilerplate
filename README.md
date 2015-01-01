# Gulp BoBrSASS Boilerplate
[![Build Status](https://travis-ci.org/SC5/gulp-bobrsass-boilerplate.png?branch=master)](https://travis-ci.org/SC5/gulp-bobrsass-boilerplate.png?branch=master)

In principle BoBrSASS is a modifiable boilerplate that combines some of our best practices:
* Gulp for fast builds
* Runs in background (watching changes), supports live reload
* Supports source maps for both JavaScript and SASS
* Browserify (or in future something else) for better web app packaging
* Spaces instead of tabs
* SASS & Compass stylesheets
* Headless protractor acceptance tests

## Installation

### Prerequisites

The latest version of BoBrSASS should work with recent versions of Ruby, SASS, Compass, Git and Gulp. Please check the correct versions, maintained in our [Travis configuration](https://github.com/SC5/gulp-bobrsass-boilerplate/blob/master/.travis.yml). If you insist on using an older version of dependencies, earlier versions of the boilerplate may work.

For system level deps, install [Node.js](http://www.nodejs.org/) 0.10 or later and [Ruby](https://www.ruby-lang.org/en/downloads/) 2.1 or later and [Git](http://git-scm.com/). When using [Git on Windows](http://msysgit.github.io/), remember to enable usage from command prompt.

Install Gulp npm module and Ruby gems for Compass and and SASS as follows:

    > npm install -g gulp 
    > gem update --system
    > gem install sass compass

Clone the project and trigger installation of the project npm dependencies by

    > git clone https://github.com/SC5/gulp-bobrsass-boilerplate.git
    > npm install

It actually performs a release build, too (to verify that everything is ok).

## Building

The current build compiles JS and CSS monoliths for both the debug and release builds. The
difference in debug builds is that they support source maps and are not minified.

To first cleanup your distribution directory and trigger **release** build (with all the tests etc.)

    > gulp clean
    > gulp

To trigger **debug** build, run gulp with a debug flag

    > gulp --debug

To keep gulp running and watch for changes, use a combination of the following flags:

    > gulp watch --debug # to disable optimisations, turn on debugging
    > gulp watch --test  # to run automated tests
    > gulp watch --nolint # to disable linting

To install, build and start everything in production mode (e.g. no devdependencies), do the whole
shebang as follows:

    > npm install --production
    > npm run-script build
    > npm start

To update your package version, you eventually want to do one of the following:

    > gulp bump --patch
    > gulp bump --minor
    > gulp bump --major
    > gulp bump # defaults to minor

## Running the Service

### Running the Stub Server
Most likely the normal *gulp serve* task will not suffice, and you want to run your own test
server, instead. The task below, will default to 'gulp serve' by default until you change it:

    > npm start
    
### Running with Docker

Boilerplate also comes with Docker support. To build and run the container, run:

    > docker build -t bobrsass .
    > docker run -d -P bobrsass

To access the service, check the dynamically allocated port (for example: 0.0.0.0:49164->8080/tcp)
and use it in browser URL

    > docker ps
    # --> http://localhost:49164/

Localhost works in Linux environment, but if you are using boot2docker, you need to use VM IP
instead. Check the IP and replace `localhost` with it:

    > boot2docker ip
    # --> http://192.168.59.103:49164/

### Live Reloading the Changes

Live reloading is enabled when running *gulp watch* in another window. Just change any of your
JavaScript or SASS files to trigger reload. The reload monitors 'dist' directory and pushes the
changes as needed.

##  Extending & Hacking

###  Project Layout

#### App

    src/             The client-side source code
    src/index.html   The HTML entry point, stub page
    src/app          Application source code
    src/app/main.js  The app JS entry point
    src/components   The 3rd party JS dependencies
    src/css          The CSS templates


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

Copyright (c) 2014 [SC5](http://sc5.io/), licensed for users and contributors under MIT license.
https://github.com/sc5/grunt-bobrsass-boilerplate/blob/master/LICENSE-MIT


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/SC5/gulp-bobrsass-boilerplate/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
