#!/bin/bash

# Allows the coder user to run a limited number of scripts as the root user.
# This is used for changing the pi password and wireless settings, and for
# rebooting the device from the Coder UI.

echo "### Granting sudo access to coder for scripts in /home/coder/coder-dist/coder-base/sudo_scripts/"
bash -c "echo 'coder ALL= NOPASSWD: /home/coder/coder-dist/coder-base/sudo_scripts/*' >>/etc/sudoers"
echo "### A line has been added to /etc/sudoers:"
echo "coder ALL= NOPASSWD: /home/coder/coder-dist/coder-base/sudo_scripts/*"
echo ""
