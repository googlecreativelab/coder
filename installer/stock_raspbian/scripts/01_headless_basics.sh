#!/bin/bash

echo "### Add ssh to start up."
insserv ssh
update-rc.d ssh enable
echo ""

echo "### Install vim."
apt-get -y install vim
echo ""

echo "### Install avahi daemon (enables mDNS/DNS-SD so you can connect to coder.local)."
apt-get -y install avahi-daemon avahi-utils
cp ../../../raspbian-addons/etc/avahi/avahi-daemon.conf /etc/avahi/avahi-daemon.conf
cp ../../../raspbian-addons/etc/avahi/services/coder.service /etc/avahi/services/
echo ""

echo "### Install dhcpd daemon (will be used to give addresses when in ad-hoc hotspot mode)."
apt-get -y install isc-dhcp-server
echo ""

echo "### Update dhcpd init.d script so it doesn't run by default."
cp ../../../raspbian-addons/etc/init.d/isc-dhcp-server /etc/init.d/isc-dhcp-server
insserv -r isc-dhcp-server
echo ""

echo "### Set up wpaconfig group."
addgroup --system wpaconfig
adduser coder wpaconfig
echo ""

echo "### Updating headless boot scripts."
cp -rv ../../../raspbian-addons/boot/coder_settings/ /boot/
cp -v /boot/config.txt /boot/config.bak
cp -v ../../../raspbian-addons/boot/config.txt /boot/config.txt

cp -v ../../../raspbian-addons/etc/iptables.up.rules /etc/
cp -v ../../../raspbian-addons/etc/network/if-pre-up.d/* /etc/network/if-pre-up.d/
cp -v ../../../raspbian-addons/etc/network/interfaces* /etc/network/

cp -v ../../../raspbian-addons/etc/default/* /etc/default/
cp -v ../../../raspbian-addons/etc/dhcp/dhcpd.conf /etc/dhcp/
cp -v ../../../raspbian-addons/etc/modprobe.d/* /etc/modprobe.d/
cp -v ../../../raspbian-addons/etc/modules /etc/modules

cp -v ../../../raspbian-addons/etc/wpa_supplicant/wpa_supplicant* /etc/wpa_supplicant/
chown -v root:wpaconfig /etc/wpa_supplicant/wpa_supplicant*
chmod -v 660 /etc/wpa_supplicant/wpa_supplicant*

cp -v ../../../raspbian-addons/etc/init.d/coder-daemon /etc/init.d/
cp -v ../../../raspbian-addons/etc/init.d/generate-ssh-hostkeys /etc/init.d/
cp -v ../../../raspbian-addons/etc/init.d/pull-coder-reset /etc/init.d/
cp -v ../../../raspbian-addons/etc/init.d/pull-hostname /etc/init.d/
cp -v ../../../raspbian-addons/etc/init.d/pull-net-interfaces /etc/init.d/
cp -v ../../../raspbian-addons/etc/init.d/pull-wpa-supplicant /etc/init.d/

echo "### Add init scripts to start up routine."
echo "Coder"
insserv coder-daemon
update-rc.d coder-daemon enable

echo "Auto ssh key regen"
insserv generate-ssh-hostkeys
update-rc.d generate-ssh-hostkeys enable

echo "Coder quick reset capability"
insserv pull-coder-reset
update-rc.d pull-coder-reset enable

echo "SD host configuration capability"
insserv pull-hostname
update-rc.d pull-hostname enable

echo "SD network interface configuration capability"
insserv pull-net-interfaces
update-rc.d pull-net-interfaces enable

echo "SD wireless configuration capability"
insserv pull-wpa-supplicant
update-rc.d pull-wpa-supplicant enable
echo ""
