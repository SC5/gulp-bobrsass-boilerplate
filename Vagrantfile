# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

MACHINE_HOSTNAME = "bobrsass2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|

  config.vm.box = "centos6.5-minimal"
  config.vm.box_url = "https://github.com/2creatives/vagrant-centos/releases/download/v6.5.3/centos65-x86_64-20140116.box"

  # Set shared folder
  config.vm.synced_folder ".", "/app"

  # We set up private network address you can use to test image
  config.vm.network :private_network, ip: "192.168.2.2"

  config.vm.provider :virtualbox do |v|
	  v.customize ["modifyvm", :id, "--name", MACHINE_HOSTNAME]
	  v.customize ["modifyvm", :id, "--natdnshostresolver1", "on"]
	  v.customize ["modifyvm", :id, "--memory", 1024]
	  v.customize ["modifyvm", :id, "--cpus", 2]
	  v.customize ["modifyvm", :id, "--ioapic", "on"]
  end

  # Ansible parameters
  config.vm.provision :shell,
    :keep_color => true,
    :inline => "cd /vagrant && ./init.sh"

  # Set up hostname of the machine
  config.vm.define MACHINE_HOSTNAME do |machine|
	  machine.vm.hostname = MACHINE_HOSTNAME
  end

end
