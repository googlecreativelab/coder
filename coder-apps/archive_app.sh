#!/bin/bash

## 
## Copies an application from the coder-base working directory to
## the coder-apps directory. 
##
## sh archive_app appname base_path apps_path
##
## Eg.
## sh archive_app hello_coder ../coder-base/ ./common/

if [ $# != 3 ]
  then
    echo -e "\nUse:\narchive_app appname base_path apps_path\n"
    exit
fi

app=$1
base=$2
dest=$3

mkdir "$dest/$app"
mkdir "$dest/$app/app"
mkdir "$dest/$app/static"
mkdir "$dest/$app/static/js"
mkdir "$dest/$app/static/css"
mkdir "$dest/$app/static/media"
mkdir "$dest/$app/views"
touch "$dest/$app/static/media/.gitignore"

cp $base/apps/$app/* $dest/$app/app/
cp $base/views/apps/$app/* $dest/$app/views/
cp $base/static/apps/$app/js/* $dest/$app/static/js/
cp $base/static/apps/$app/css/* $dest/$app/static/css/
cp $base/static/apps/$app/media/* $dest/$app/static/media/
