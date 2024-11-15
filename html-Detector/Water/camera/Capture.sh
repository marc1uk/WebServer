#!/bin/bash

# This script polluted cron messages with
# [swscaler @ 0x55a34fc7ce00] [swscaler @ 0x55a3503ef880] deprecated pixel format used, make sure you did set range correctly
# According to
# https://superuser.com/questions/1273920/deprecated-pixel-format-used-make-sure-you-did-set-range-correctly
# it can safely be ignored -- Evgenii, 2024-11-10

ffmpeg -v error -y -i rtsp://admin:wcte%40CERN%21@192.168.11.13:554/ -vframes 1 /mnt/ramdisk/T09Camera.jpg
ffmpeg -v error -y -i rtsp://neutrino:Neutrino1987@192.168.11.1:554/MediaInput/h232 -vframes 1 /mnt/ramdisk/WaterCamera.jpg
