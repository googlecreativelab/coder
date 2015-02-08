#!/bin/bash


echo "Removing any generated SSL keys and certs."
rm /etc/ssh/ssh_host_dsa_key
rm /etc/ssh/ssh_host_dsa_key.pub
rm /etc/ssh/ssh_host_ecdsa_key
rm /etc/ssh/ssh_host_ecdsa_key.pub
rm /etc/ssh/ssh_host_rsa_key
rm /etc/ssh/ssh_host_rsa_key.pub
rm /home/coder/coder-dist/coder-base/certs/server.*
echo ""

echo "Resetting Coder http configuration defaults."
cp /home/coder/coder-dist/coder-base/config.js.default /home/coder/coder-dist/coder-base/config.js
cp /home/coder/coder-dist/coder-base/device.json.reset /home/coder/coder-dist/coder-base/device.json
rm -rf /home/coder/coder-dist/coder-base/tmp/*
echo ""

echo "Clearing out user history files."
rm /home/pi/coder_bootstrap_install.sh
rm /root/.bash_history
rm /root/.viminfo
rm /home/pi/.bash_history
rm /home/pi/.viminfo
rm /home/coder/.bash_history
rm /home/coder/.viminfo
rm /home/coder/.gitconfig
echo ""

echo "Resetting hostname and hosts files in /boot/coder_settings."
touch /boot/coder_settings/reset.txt
cp ../../../raspbian-addons/boot/coder_settings/hosts.txt /boot/coder_settings/hosts.txt
cp ../../../raspbian-addons/boot/coder_settings/hostname.txt /boot/coder_settings/hostname.txt
echo "nameserver 8.8.8.8" >/etc/resolv.conf
echo ""

echo "Resetting wifi and network defaults."
cp ../../../raspbian-addons/etc/network/interfaces /etc/network/interfaces
cp ../../../raspbian-addons/etc/network/interfaces.reset /etc/network/interfaces.reset
chown root:root /etc/network/interfaces
chown root:root /etc/network/interfaces.reset
chmod 664 /etc/network/interfaces
chmod 664 /etc/network/interfaces.reset
cp ../../../raspbian-addons/etc/wpa_supplicant/wpa_supplicant.conf.reset /etc/wpa_supplicant/wpa_supplicant.conf
chown root:wpaconfig /etc/wpa_supplicant/wpa_supplicant.conf
chmod 660 /etc/wpa_supplicant/wpa_supplicant.conf
echo ""

echo "Clearing system log files."
rm /var/log/messages
rm /var/log/syslog
rm /var/log/wtmp
touch /var/log/wtmp
chmod 644 /var/log/wtmp
rm /var/log/dmesg*
rm /var/log/debug
touch /var/log/debug
rm /var/log/btmp
touch /var/log/btmp
chmod 644 /var/log/btmp
rm /var/log/auth.log
touch /var/log/auth.log
chown root:adm /var/log/auth.log
chmod 640 /var/log/auth.log
touch /var/log/user.log
chown root:adm /var/log/user.log
chmod 640 /var/log/user.log
echo ""

# Reset pi password to raspberry
echo "Choose the default pi passwd (normally this should be raspberry)"
passwd pi

echo ""
echo "Done!"
echo ""

