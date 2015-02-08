#!/bin/bash

echo "### Setting up the coder account."
adduser --system --group coder
echo ""


echo "### Downloading the Coder git repo to /home/coder/coder-dist."
su -s/bin/bash coder <<'EOF'
cd /home/coder
git clone https://github.com/googlecreativelab/coder.git coder-dist
EOF
echo ""


