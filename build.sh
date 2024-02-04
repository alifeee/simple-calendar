#!/bin/bash
# build with npm via docker

docker run --rm --workdir /_site -v $(pwd):/_site --entrypoint "npm" node:18.16.1-alpine3.18 run build
