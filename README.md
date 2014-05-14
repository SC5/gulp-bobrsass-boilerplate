# Gulp BoBrSASS Boilerplate
[![Build Status](https://travis-ci.org/SC5/gulp-bobrsass-boilerplate.png?branch=master)](https://travis-ci.org/SC5/gulp-bobrsass-boilerplate.png?branch=master)

Gulp BoBrSASS Boilerplate is an evolutionary step from our earlier
[Grunt BoReLESS Boilerplate](https://github.com/SC5/grunt-boreless-boilerplate?source=cc).
It aims to cover the same needs, but at the same time remove some of the annoyances we have
encountered:
* Faster builds
* Runs in background (watching changes), supports live reload
* Supports source maps for both JavaScript and SASS
* Scriptless, NPM driven deployments (to ease e.g. AWS OpsWorks & Windows deployments)
* Browserify (or in future something else) for better web app packaging

Rather than being fashionably opinionated, for some less significant things a democratic process
works better (no matter how good or bad the opinions were). Therefore, the majority votes have
been cast as follows:
* Spaces instead of tabs
* SASS & Compass instead of LESS
* Jasmine instead of Karma

## Installation

If you don't already have node.js 0.10.x or later, fetch it from
[nodejs.org](http://www.nodejs.org/). In addition we need a few dependencies
you may have.

    > npm install -g gulp
    
In addition, you will need [Ruby](https://www.ruby-lang.org/en/downloads/) to use
Compass framework for compiling SASS stylesheets into CSS and sprite sheets:

    > gem update --system
    > gem install sass
    > gem install compass

Note that you may need to first uninstall other SASS versions than (3.2.x).

Installing the project itself is easy. Both build system dependencies and app dependencies are
triggered by

    > npm install

It actually performs a release build, too (to verify that everything is ok).

## Building

The current build compiles JS and CSS monoliths for both the debug and release builds. The big
difference is that the debug build supports source maps and is not minified.

To first cleanup your distribution directory and trigger **release** build

    > gulp clean
    > gulp

To trigger **debug** build, run gulp with a debug flag

    > gulp --debug
    
To keep gulp running and watch for changes, use e.g.

    > gulp watch --debug

To update your package version, you eventually want to do one of the following:

    > gulp bump --patch
    > gulp bump --minor
    > gulp bump --major
    > gulp bump # defaults to minor

## Running the Service

Most likely the normal *gulp serve* task will not suffice, and you want to run your own test
server, instead. The task below, will default to 'gulp serve' by default until you change it:

    > npm start

### Live reloading the changes

Live reloading is enabled when running *gulp watch* in another window. Just change any of your
JavaScript or SASS files to trigger reload. The reload monitors 'dist' directory and pushes the
changes as needed.

##  Extending & Hacking

###  Project layout

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

* SASS source maps
* Add more examples & documentation

## Release History

* 2014/02/12 - v0.1.0 - Initial commit (partially working stub)
* 2014/02/24 - v0.1.1 - Fix the build errors, update README
* 2014/05/08 - v0.2.0 - Update dependecies, add linting and plugin loader, update README
* 2014/05/09 - v0.3.0 - Add Protractor test framework, update README
* 2014/05/14 - v0.3.1 - Better linting

## License

Copyright (c) 2014 [SC5](http://sc5.io/), licensed for users and contributors under MIT license.
https://github.com/sc5/grunt-bobrsass-boilerplate/blob/master/LICENSE-MIT


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/SC5/gulp-bobrsass-boilerplate/trend.png)](https://bitdeli.com/free "Bitdeli Badge")

