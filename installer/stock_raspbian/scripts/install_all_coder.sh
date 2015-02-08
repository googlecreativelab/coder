#!/bin/bash

cat <<EOF
==================================================================
Beginning Coder installation.

This will update your Raspberry Pi, install all the required
packages for Coder, and configure your Pi to be configured
via a web browser, without the use of a monitor.

EOF


./00_latest_updates.sh
./01_headless_basics.sh
./02_coder_dependencies.sh

cat <<EOF





==================================================================
Coder installation is almost complete.

FINAL STEP:

In order for Coder to be able to update your password and wireless
settings, it needs to have limited sudo access.
If you haven't done this already, you can run the following command
to grant this access to the coder user.

sudo ./grant_coder_sudo.sh

Do not run this command if you've already given sudo access to
coder during a previous install.

EOF
