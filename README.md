# Deploy-meteor-on-openshift

You know it all, deploying on .meteor.com is no more possible.
So if you need to deploy your Meteor application on a free Paas , OpenShift could be a great
alternative.



**Note !** : This repository and work is based on the great atricle written by [Tutas-labs](http://www.tutas-labs.com/deploying-meteor-applications-to-openshift-paas/).


## Introduction
OpenShift is a Paas provided by RedHat. The free plan gives you 3 gears with 1G of disk space.

It does not provide official support for Meteor for the moment by it allows you
to create your own.

## 1. Create your OpenShift application
The first thing to do is to create an application on OpenShift. You need
to use `Do-It-Yourself 0.1` which is a boileprate you can customize to make it
support Meteor. Openshift creates a Git repository that you will clone on your
machine to commit your Meteop app bundle on it.

Then, you need to add the follwing 'cartidiges' :
+ MongoDB 2.4
+ Cron 1.4 : to lunch so recurent tasks like checking application state
+ If your Meteor application uses Spiderable package to make it SEO friendly, you
need PhantomJS to be installed with your Openshift application. Openshift does
not provide it as cartidige, but it allows you to insall it via a URL,we will use
this one : https://raw.githubusercontent.com/daniel-sc/casperjs-cartridge/master/metadata/manifest.yml

## 2. Clone your Openshift Repo on your machine
You need to clone the repo on your machine, we will use for this guide
`app-deploy` as the name for the directory on our machine.
```sh
git clone YOUR_REPO_URL app-deploy
```
The initial content of the repo is the follwing :
```sh
ls -al

.git/
.openshift/
README.md
diy/
misc/
```

Delete `.openshift/` , `README.md` , `diy/` and `misc/`

## 3. Clone this repo on your machine
You need to clone this repo on your machine to copy its content on `app-deploy`
directory ( except `.git/` directory ), we will use for this guide `app-diy` as
name.

```sh
git clone https://github.com/nabiltntn/deploy-meteor-on-openshift.git app-diy
```

Copy all the content of `app-diy`  ( except `.git/` folder ) on `app-deploy`

CD to `app-deploy` and install dependencies :

```sh
npm install
```

Your can after that delete `app-diy` if you want.

## 4. Create a bash script on your Meteor app directory and copy/paste this script

We will give it `push.sh` as name.


```bash

#!/bin/sh
# this assumes you created the openshift directory in your home directory
# modify the script if this is not the case

if [ $# -eq 0 ]
  then
    echo "Error : you need to precise the path to your application local repo as first argument"
    exit 0
fi

DEPLOY_PROJECT_FOLDER=$1
TODAY=`date +%d-%m-%Y`
APP_NAME=${PWD##*/}
BUNDLE_NAME=${APP_NAME}.tar.gz
BUNDLE_EXTRACT_FOLDER="bundle"

echo "-> App local Git repo directory to use : $1 "
echo '-> Start building the application'

meteor build ${DEPLOY_PROJECT_FOLDER}

cd ${DEPLOY_PROJECT_FOLDER}

echo "-> Delete the old $BUNDLE_EXTRACT_FOLDER folder to prepare extract"
rm -rf ${BUNDLE_EXTRACT_FOLDER}

echo "-> Clean repo from deleted files"
git rm -r ${BUNDLE_EXTRACT_FOLDER}

echo '-> Start extracting the application bundle to deploy project folder'
tar -xvf ${BUNDLE_NAME} ${BUNDLE_EXTRACT_FOLDER}

echo '-> Delete the generated bundle'
rm ${BUNDLE_NAME}

echo '-> Generate app_packages_npm_deps file containing the list of app packages NPM dependencies to use in app build'
node loadNpmModules.js > app_packages_npm_deps

echo '-> Create a file with last deploy date ( also to force deploy even if nothing changed )'
date -u > last_build_date

echo '-> Commit new version to local repo'
git add .
git commit -am "Deploy ${APP_NAME} on ${TODAY}"

echo '-> Push new bundle to app remote Repo on openshift'
git push

```

This script will do the following :
+ Checks if we pass the path the your local Openshift app repo , for this guide
the path to `app-deploy`
+ Builds your Meteor application
+ Extracts application bundle to `app-deploy` in `bundle` directory
+ Generates `app_packages_npm_deps` file that contains all the NPM modules required
by your Meteor application packages ( if they depend on ) instead of 'guessing'
them.
This file will be used to install required NPM modules for your Openshift
application while bootstraping.
+ Commits all modifications to your local `app-deploy`
+ Pushs the app to remote Openshift app to install/update it and restart

**And !!**

To deploy, CD to your Meteor application and exectue `push.sh` with the path
to `app-deploy`

```sh
./push.sh (path to `app-deploy`)
```

**If you want to deploy a new version of the application, you dont have to repeat
all the previous steps. Just execute the last command.**



## Notes
+ For this guide, i copied a settings.json file `settings-prod.json` under
private directory in my Meteor application. During the build process, this
file is copied under `app-deploy/bundle/programs/server/assets/app/settings-prod.json`
If your application uses a different name, then you have to indicate it in
`app-deploy/.openshift/actions_hooks/start` file.
+ To access application logs, your need to use Openshift `rhc` client and use
the `rhc tail APPLICATION_NAME` command. The application generates two files :
`app_log.log` and `app_err.log`
+ If your openshift application uses custom domain name, you can change
`ROOT_URL` env variable in `app-deploy\meteorshim.js`
```js
process.env.ROOT_URL = "http://YOUR_CUSTOM_DOMAIN" || "http://localhost";
```
