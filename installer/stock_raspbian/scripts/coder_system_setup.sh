
# set up coder account
adduser --system --group coder


# fetch the latest coder tree
su -s/bin/bash coder <<'EOF'
cd /home/coder
git clone https://github.com/googlecreativelab/coder.git coder-dist
EOF


