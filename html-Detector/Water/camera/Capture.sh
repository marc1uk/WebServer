#!/bin/bash

ffmpeg -y -i rtsp://admin:wcte%40CERN%21@192.168.11.13:554/ -vframes 1 /mnt/ramdisk/T09Camera.jpg
ffmpeg -y -i rtsp://neutrino:Neutrino1987@192.168.11.1:554/MediaInput/h232 -vframes 1 /mnt/ramdisk/WaterCamera.jpg
