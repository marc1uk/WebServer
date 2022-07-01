#!/bin/bash
echo `\'`
echo `echo "select TO_CHAR(time, 'yyyy-mm-dd hh24:mi:ss')  , null from stats order by time ASC;" |psql   -d gd -t | sed s:a:\':g`
echo '@'
echo `echo "select mem, null from stats;" |psql   -d gd -t`
echo '@'
echo `echo "select cpu, null from stats;" |psql   -d gd -t`
echo '@'
echo `echo "select temp, null from stats;" |psql   -d gd -t`
echo '@'
echo `echo "select hdd1, null from stats;" |psql   -d gd -t`
echo '@'
echo `echo "select hdd2, null from stats;" |psql   -d gd -t`
echo `\'`
