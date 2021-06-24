#!/bin/bash

# https://inkscape.org/doc/inkscape-man.html

DPIs="96 120 144"

for svg in *.svg; do
  for dpi in $DPIs; do
    name=$(echo $f | cut -d'.' -f1);
    echo "Create ${nf}_${w}.png"
    inkscape \
        --batch-process \
        --convert-dpi-method="scale-document" \
        --export-filename="${name}_${dpi}.png" \
        --export-type="png" \
        --export-background-opacity=0 \
        --export-dpi=$dpi \
        $svg;
    echo;
  done
done
