#!/bin/bash

for f in test/*_test.js
do
  echo \*\*\* $f \*\*\*
  node $f || exit
done
