#!/bin/bash
# build with npm via docker

docker run --rm --workdir /_site -v $(pwd):/_site --entrypoint "npm" node:current-alpine3.19 run build --no-update-notifier
