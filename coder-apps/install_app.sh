#!/bin/bash

## 
## Copies an application from the coder-apps/[variant] directory to
## the coder-base working directory. 
##
## sh install_app appname base_path apps_path
##
## Eg.
## sh install_app hello_coder ../coder-base/ ./common/

if [ $# != 3 ]
  then
    echo -e "\nUse:\ninstall_app appname coderbase apppath\n"
    exit
fi

app=$1
base=$2
from=$3

mkdir "$base/apps/$app"
mkdir "$base/static/apps/$app"
mkdir "$base/static/apps/$app/js"
mkdir "$base/static/apps/$app/css"
mkdir "$base/static/apps/$app/media"
mkdir "$base/views/apps/$app"

cp $from/$app/app/* $base/apps/$app/
cp $from/$app/views/* $base/views/apps/$app/
cp $from/$app/static/js/* $base/static/apps/$app/js/
cp $from/$app/static/css/* $base/static/apps/$app/css/
cp $from/$app/static/media/* $base/static/apps/$app/media/

