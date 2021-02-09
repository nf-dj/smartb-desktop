#!/bin/sh
#npm run make
#scp -P 2122 out/smartb_desktop-win32-x64/smartb_desktop.exe nf@prod2.netforce.com:run/static/
cd out
zip -r smartb_desktop-win32-x64-v11.zip smartb_desktop-win32-x64
scp -P 2122 smartb_desktop-win32-x64-v11.zip nf@prod2.netforce.com:run/static/
