# Gulp BoBrSASS Boilerplate
[![Build Status](https://travis-ci.org/SC5/gulp-bobrsass-boilerplate.png?branch=master)](https://travis-ci.org/SC5/gulp-bobrsass-boilerplate.png?branch=master)

This is an intermediary version that is very much work in progress. We will update it constantly.

Gulp BoBrSASS Boilerplate is an evolutionary step from our earlier [Grunt BoReLESS Boilerplate](https://github.com/SC5/grunt-boreless-boilerplate?source=cc). It aims to cover the same needs, but at the same time remove some of the annoyances we have encountered:
* Faster builds
* Runs in background (watching changes) by default
* Scriptless, NPM driven deployments (to ease e.g. AWS OpsWorks & Windows deployments)
* Browserify (or in future something else) for better web app packaging

Rather than being fashinably opinionated, for some less significant things a democratic process would work better (no matter how good or bad the opinions were). Therefore, the majority votes have been casted as follows:
* Spaces instead of tabs
* SASS instead of LESS
* Jasmine instead of Karma

The interfaces for triggering the build remain pretty much the same as for BoReLESS - just substitute 'grunt' with 'gulp'.

## Installation

If you don't already have node.js 0.8.x or later, fetch it from
[nodejs.org](http://www.nodejs.org/). In addition we need a few dependencies
you may have.

    > npm install -g gulp

Installing the project itself is easy. Both build system dependencies and app
dependencies are triggered by

    > npm install

It actually performs a release build, too (to verify that everything is ok).

## Building

To trigger **debug** build

    > grunt debug

To trigger **debug** build and watch for changes

    > grunt debug watch

To trigger **release** build

    > grunt release

## Running the Service

Most likely the normal *grunt server* will fail (yet there is no big reason
why it should). The system comes with bundled *node/express* stack, because
that is likely you would use for development use, anyway. Start the server in
**debug** mode by

    > npm start

Note that if you have run *grunt debug* in another window, it should be
rebuilding your changed pages in the background.

To test the service in **release** mode, use

    > grunt release
    > NODE_ENV=production node server/server.js

You most likely want to re-run the tests and reload the files automatically.
Start the debug server elsewhere, then run

    > grunt monitor

And the build will start to watch the changes in your project, triggering
reload when needed.

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

    grunt.js            The Grunt build configuration
    components.json     The Bower components
    .bowerrc            The Bower directory overrides
    package.json        The build level dependencies

### Build Results

    dist/               Minified & optimised version

## Using BoReLESS as an Upstream

Upgrading the boilerplate in your project may be tedious work. Once BoReLESS
directory structure becomes stable (it might be already, but no guarantees!),
you can use it directly as an upstream (here with a name 'boreless').

    > git remote add -f boreless git@github.com:SC5/grunt-boreless-boilerplate.git

Now synchronizing with BoReLESS becomes easier:

    > git pull boreless master

It is possible to use BoReLESS as a subtree, too:

    > git subtree add --prefix client --squash git@github.com:SC5/grunt-boreless-boilerplate.git master --squash
    > git remote add -f boreless git@github.com:SC5/grunt-boreless-boilerplate.git
    > git fetch boreless master

The example pulls BoReLESS master branch into 'client' subdirectory. The key here is to use
'--prefix client' to keep the boilerplate in its own subdirectory. Later on, sync by:

    > git subtree pull --prefix client boreless master


## TODO

* Use some sensible app boilerplate (or fetch it from another project)
* Add Cordova builds (or put it its own branch or an example)
* Add templating language compilation into JS RequireJS modules
* Add some examples & documentation

## Release History

* 2013/01/16 - v0.1.0 - Initial release
* 2013/03/10 - v0.2.0 - Update to Grunt 0.4.0
* 2013/10/12 - v0.3.0 - Add Karma based test automation

## License

Copyright (c) 2013 [SC5](http://sc5.io/), licensed for users and contributors under MIT license.
https://github.com/sc5/grunt-boreless-boilerplate/blob/master/LICENSE-MIT
