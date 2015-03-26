#!/usr/bin/env bash

yum install -y epel-release
yum install -y git npm bzip2 tar which
yum groupinstall -y "Development Tools"
gpg --keyserver hkp://keys.gnupg.net --recv-keys D39DC0E3
curl -sSL https://get.rvm.io | bash -s stable
source /etc/profile.d/rvm.sh
rvm install ruby-2.1.3
rvm use ruby-2.1.3
gem install sass compass
npm install -g bower gulp
bower install --allow-root
npm install --debug
