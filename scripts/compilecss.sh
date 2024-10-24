#!/bin/zsh

script_path=$(dirname "$0")
inputdir="$script_path/../src/css"
outdir="$script_path/../dist"
green_color="\033[32m"
default_color="\033[0m"

if [ ! -d "$outdir" ]; then
  mkdir -p "$outdir"
fi

for file in $(ls ./$inputdir); do
  echo $green_color
  echo "compiling $file"
  echo $default_color
  $script_path/tailwindcss -i ./$inputdir/$file -o ./$outdir/$file
done