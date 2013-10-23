#!/bin/bash

## 
## Copies the common platform apps to
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

./install_app.sh auth $base ./common/
./install_app.sh boilerplate $base ./common/
./install_app.sh coder $base ./common/
./install_app.sh coderlib $base ./common/
./install_app.sh editor $base ./common/
./install_app.sh eyeball $base ./common/
./install_app.sh game2d $base ./common/
./install_app.sh hello_coder $base ./common/
./install_app.sh space_rocks_ $base ./common/

