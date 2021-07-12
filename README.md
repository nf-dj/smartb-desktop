# Installation Guide

### 1. Install nodes module

make sure you're in the working directory.

--> npm i 

### 2. Compile 

--> npm run make 

# Compiled version download link

http://main.smartb.co/static/smartb_desktop-v26.zip

# Debug log

### 1. serial port module not found 

make sure you're in directory **/out/smartb_desktop-win32-x64\resources\app**

-->npm i serialport

-->npm install --save-dev electron-rebuild

--> .\node_modules\\.bin\electron-rebuild.cmd

### 2. Visual Studio C++ environment issue

refer to the link for solutions

https://stackoverflow.com/questions/57879150/how-can-i-solve-error-gypgyp-errerr-find-vsfind-vs-msvs-version-not-set-from-c

