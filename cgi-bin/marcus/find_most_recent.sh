#!/bin/bash

if [ $# -gt 1 ]; then
	DIR="$1"
else
	DIR=/mnt/data
fi

find $DIR -type f -printf "%T@ %p\n" | 
awk '
BEGIN { recent = 0; file = "" }
{
if ($1 > recent)
   {
   recent = $1;
   file = $0;
   }
}
END { print file; }' |
sed 's/^[0-9]*\.[0-9]* //'
