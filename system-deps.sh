#!/bin/sh

echo 'Checking Ruby:'

if ruby --version 2>/dev/null; then
    echo 'Ruby found.'
    echo
else
    echo 'DEPENDENCY MISSING!'
    echo 'Install Ruby <https://www.ruby-lang.org/>'
    exit 1
fi

echo 'Checking Bundler:'

if bundle --version 2>/dev/null; then
    echo 'Bundler found, running `bundle install`.'
    echo 'If this fails, try to update rubygems: `gem update --system`.'
    echo
    bundle install
else
    echo 'DEPENDENCY MISSING!'
    echo 'Install <http://bundler.io/>, usually `gem install bundler`.'
    exit 2
fi
