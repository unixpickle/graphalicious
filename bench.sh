#!/bin/bash

for f in bench/*_bench.js
do
  echo \*\*\* $f \*\*\*
  node $f || exit
done
