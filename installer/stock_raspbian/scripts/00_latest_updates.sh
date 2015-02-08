#!/bin/bash

echo "### Fetch all the latest Pi updates."
apt-get -y update
apt-get -y dist-upgrade
echo ""


echo "### Update the kernel and firmware to latest versions."
rpi-update
echo ""

