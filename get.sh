#!/bni/sh
cd ..
rsync -avz -e 'ssh' ubuntu@prod.netforce.com:smartb_desktop . --exclude=node_modules/ --exclude=out/
