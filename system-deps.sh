#!/bin/sh

if ruby --version; then
    echo 'Ruby found.'
else
    echo 'DEPENDENCY MISSING!'
    echo 'Install Ruby <https://www.ruby-lang.org/>'
    return 1;
fi

if bundle --version; then
    echo 'Bundler found, running `bundle install`.'
    echo 'If this fails, try to update rubygems: `gem update --system`.'
    bundle install
else
    echo 'DEPENDENCY MISSING!'
    echo 'Install <http://bundler.io/>, usually `gem install bundler`.'
    return 1;
fi
