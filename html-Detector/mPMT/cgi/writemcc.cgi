#!/usr/bin/env python3

import urllib.parse
import os
import sys
import socket
import struct
import datetime
import argparse

class MCCWriter:
    mccs = {
        'mcc0' : '192.168.10.235',
        'mcc1' : '192.168.10.236',
        'mcc2' : '192.168.10.237',
        'mcc3' : '192.168.10.238',
        'mcc4' : '192.168.10.239',
        'mcc5' : '192.168.10.240',
        'mcc6' : '192.168.10.241',
        'mcc7' : '192.168.10.242',
        'mcc8' : '192.168.10.243',
        'mcc9' : '192.168.10.244',
        'mcc10' : '192.168.10.245',
        'mcc11' : '192.168.10.246',
        'mcc12' : '192.168.10.247',
        'mcc13' : '192.168.10.248',
        'mcc14' : '192.168.10.249',
    }
    writer_port = 20000
    multicast_port = 55554
    multicast_address = "239.192.1.1"
    device_name = "MCCController"

    def __init__(self,local_ip):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        #self.sock.bind(('', self.writer_port))
        self.sock.settimeout(5.0)
        self.mcastsock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.mcastsock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.mcastsock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_IF, socket.inet_aton(local_ip))

    def write_single(self,idx,channels):
        key = f"mcc{idx}"
        if key not in self.mccs:
            return None
        oar = [0 if not x else 1 for x in channels]
        out = struct.pack("BBBBBBBB",*oar)
        self.sock.sendto(out, (self.mccs[key], self.writer_port))
        return f"MCC {idx} set to {oar}"

    def publish_log(self,report):
        severity = 3
        timestamp = int(datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000)
        s = bytearray(f'{{ "topic":"logging", "time":{timestamp}, "device":"{self.device_name}", "severity": {severity}, "message":"{report}" }}'.encode('utf8'))
        s.append(0)
        try:
            self.mcastsock.sendto(s,(self.multicast_address,self.multicast_port))
        except:
            print("Multicast send failed")
        return timestamp
    
def run_cgi():
    
    def run():
        try:
            ip = [(s.connect(('8.8.8.8', 53)), s.getsockname()[0], s.close()) for s in [socket.socket(socket.AF_INET, socket.SOCK_DGRAM)]][0][1]
        except:
            return "9"
        e = os.environ
        if 'REQUEST_METHOD' in e:
            if e['REQUEST_METHOD'] == "POST":
                data = []
                if 'CONTENT_TYPE' in e:
                    if 'application/x-www-form-urlencoded' in e['CONTENT_TYPE']:
                            data = urllib.parse.parse_qs(str(sys.stdin.read()), keep_blank_values=True)                            
                            if 'mcc' in data and 'config' in data:
                                # verify data
                                try:
                                    mcc_i = int(data['mcc'][0])
                                except:
                                    return "5"
                                cfg = data['config'][0]
                                if len(cfg)!=8:
                                    return "6"
                                chans = []
                                for c in cfg:
                                    if c != '0' and c!= '1':
                                        return "7"
                                    chans.append(int(c))

                                log = f"{mcc_i} {chans} - debug"
                                try:
                                    m = MCCWriter(ip)
                                    log = m.write_single(mcc_i,chans)
                                    m.publish_log(log)
                                except  Exception as e:
                                    return "10"
                
                                print("Status: 200 OK\n\n")
                                print(f"Sent via {ip}: {log}")
                                exit(0)                            
                            return "8"
                    return "4"
                return "3"
            return "2"
        return "1"

    err = run()

    print("Status: 400 Invalid request\n\n")
    print(f"Invalid request, error: {err}")

def run_cmdline():    
    parser = argparse.ArgumentParser(description='PPS reset test')    
    parser.add_argument("-i","--ip", type=str ,required=True)
    parser.add_argument("-m","--mcc", type=int, required=True)
    parser.add_argument("channel",type=int, nargs=8)
    args = parser.parse_args()
    m = MCCWriter(args.ip)
    try:
        log = m.write_single(args.mcc,args.channel)
        print(log)
        m.publish_log(log)
    except  Exception as e:
        print(f"Failed {e}")

if __name__ == "__main__":
    e = os.environ
    if 'GATEWAY_INTERFACE' in e:
        run_cgi()
    else:
        run_cmdline()

