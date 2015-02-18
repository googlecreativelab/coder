#!/bin/bash

echo "### Install I2C Tools."
apt-get -y install i2c-tools
echo "### Let gpio group access gpio."
cp -v ../../../raspbian-addons/etc/udev/rules.d/10-gpio.rules /etc/udev/rules.d/10-gpio.rules

echo "### Install Zip."
apt-get -y install zip

echo "### Add coder user to [spi, gpio, audio, video, i2c] groups (device access that coder needs)."
adduser coder spi
adduser coder gpio
adduser coder audio
adduser coder video
adduser coder i2c
echo ""

echo "### Install redis."
apt-get -y install redis-server
cp -v ../../../raspbian-addons/etc/redis/redis.conf /etc/redis/redis.conf
echo ""

echo "### Install nodejs and npm."
# The node packages are really old...
# Ideally, we'd do: apt-get -y install nodejs npm
# For now, we'll install manually from nodejs.org to /opt/node/
mkdir tmp
wget http://nodejs.org/dist/v0.10.7/node-v0.10.7-linux-arm-pi.tar.gz -P tmp/
tar -zxv -C tmp/ -f tmp/node-v0.10.7-linux-arm-pi.tar.gz
cp -rv tmp/node-v0.10.7-linux-arm-pi /opt/node
ln -s /opt/node/bin/node /usr/bin/node
ln -s /opt/node/bin/npm /usr/bin/npm
rm -rf tmp
echo ""

echo "### Installing Coder base apps (you can ignore any stat warnings)."
su -s/bin/bash coder <<'EOF'
cd /home/coder/coder-dist/coder-apps
./install_pi.sh ../coder-base
EOF
echo ""

echo "### Adding Raspberry Pi Coder features."
cp -rv ../../../raspbian-addons/home/coder/coder-dist/coder-base/sudo_scripts ../../../coder-base/
chown root:root -Rv ../../../coder-base/sudo_scripts
chmod -v 744 ../../../coder-base/sudo_scripts/*
echo ""

echo "### Installing node.js modules."
su -s/bin/bash coder <<'EOF'
cd /home/coder/coder-dist/coder-base
cp ../raspbian-addons/home/coder/coder-dist/coder-base/package.json .
npm install
EOF
echo ""
