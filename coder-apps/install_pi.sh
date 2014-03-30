#!/bin/bash

##
## Copies the common platform and additional pi version apps to
## the coder-base working directory. 
##
## sh install_common base_path
##
## Eg.
## sh install_common ../coder-base/

if [ $# != 1 ]
  then
    echo -e "\nUse:\ninstall_common coderbase\n"
    exit
fi

base=$1

./install_common.sh $base

./install_app.sh auth $base ./pi/
./install_app.sh coder $base ./pi/
./install_app.sh wifi $base ./pi/

