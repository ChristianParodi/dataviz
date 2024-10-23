#!/bin/zsh

inputdir="./src/css"
outdir="./dist"
green_color="\033[32m"
default_color="\033[0m"

if [ ! -d "$outdir" ]; then
  mkdir -p "$outdir"
fi

for file in $(ls ./$inputdir); do
  echo $green_color
  echo "compiling $file"
  echo $default_color
  ./tailwindcss -i ./$inputdir/$file -o ./$outdir/$file
done