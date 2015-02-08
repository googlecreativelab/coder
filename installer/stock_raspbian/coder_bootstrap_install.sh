
echo "### Set up coder account."
adduser --system --group coder
echo ""


echo "### Fetch the latest coder tree and install in /home/coder/coder-dist"
su -s/bin/bash coder <<'EOF'
cd /home/coder
git clone https://github.com/googlecreativelab/coder.git coder-dist
EOF
echo ""

echo "### Changing directory to raspian install scripts."
echo "### /home/coder/coder-dist/installer/stock_raspbian/scripts"
cd /home/coder/coder-dist/installer/stock_raspbian/scripts
echo ""

cat <<EOF

------------------------------------------------------------------
Ready to install Coder on your Raspberry Pi!

The following command will:
  - Update your system packages and kernel to the latest version.
  - Configure your Pi for headless operation.
  - Install all Coder dependencies and 3rd party node modules.
  - Set up Coder to boot when your Pi is restarted.

To continue, run the following:

sudo ./install_all_coder.sh



EOF
