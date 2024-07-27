#!/bin/bash

ffmpeg -y -i rtsp://admin:admin@192.168.50.130:8554/Streaming/Channels/101 -vframes 1 /mnt/ramdrive/cam.jpg
