#!/bin/bash

export NVM_DIR="/usr/alifeee/nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

nvm use 20

npm run build
