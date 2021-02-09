#!/bin/sh
cd ..
rsync -avz -e 'ssh' smartb_desktop ubuntu@prod.netforce.com: --exclude=node_modules/ --exclude=out/
#rsync -avz -e 'ssh -p 2122' smartb_desktop nf@prod2.netforce.com: --exclude=node_modules/ --exclude=out/
