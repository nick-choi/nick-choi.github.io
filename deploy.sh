#!/bin/bash
git add .
git commit -m 'new deploy'
git push
mkdocs gh-deploy
