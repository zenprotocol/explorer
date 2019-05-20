#!/bin/bash

# Uses npm version to update the package version
# then creates a git tag and pushes it along with the version change to origin
# see https://docs.npmjs.com/cli/version for options
# usage example: ./build_scripts/release.sh minor

# Bail on first error
# See https://medium.com/@nthgergo/publishing-gh-pages-with-travis-ci-53a8270e87db
set -o errexit

BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "${BRANCH}" != 'master' ]; then
  echo "must release from master"
  exit 0
fi

if [ "$#" != "1" ]; then
    echo "Illegal number of parameters, supply only 1 param to npm version https://docs.npmjs.com/cli/version"
    exit 0
fi

npm version $1 -m "Release %s"
tag=$(git tag --points-at HEAD)
git push origin "$tag"
git push
