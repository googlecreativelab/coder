# Coder for Raspberry Pi
# A simple platform for experimenting with web stuff.
# http://goo.gl/coder
#
# Copyright 2013 Google Inc. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


import os
import sys
import subprocess
import select
import time
import signal
import math
import re

##usage formatsdcard really [devid]
## device id needs to be greater than 0 (avoid accidentally overwriting hard disk)
if ( len(sys.argv) == 3 and sys.argv[1] == "really" and int(sys.argv[2]) > 0 ):

    sdCardDev = int( sys.argv[2] )
    
    #print "ENV: " + str( os.environ )

    ## Unmount any drives on this disk
    for x in range(1,10):
        command = "diskutil unmount /dev/disk" + str( sdCardDev ) + "s" + str(x)
        print( "DOIT: " + command )
        os.system( command )


    filepath = "."
    if 'EXECUTABLEPATH' in os.environ.keys():
        #look for raspi.img in same directory as installer app (if using py2app)
        filepath = os.path.normpath( os.environ['EXECUTABLEPATH'] + "/../../../.." )
    filepath = filepath + '/raspi.img'
    print( "FILEPATH: " + filepath )

    filesize = os.path.getsize( filepath )
    progresssize = 0
    command = 'dd bs=2m if=' + filepath + ' of=/dev/rdisk' + str( sdCardDev )
    print( "FORMATTING: " + command )

    proc = subprocess.Popen( command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE )
    #inpoll = select.poll()
    #inpoll.register( proc.stdout, select.POLLIN )
    kq = select.kqueue()
    ke = select.kevent( proc.stderr )
    

    hadError = False

    while True:
        #send siginfo ctrl-t
        #hasdata = inpoll.poll(0)
        hasdata = kq.control( [ke], 1, 0.1 )

        if proc.poll() is not None:
            if proc.poll() > 0:
                hadError = True
            break
        elif not hasdata:
            #print "NODATA"
            proc.send_signal( signal.SIGINFO )
            time.sleep(1)
        else:
            line = proc.stderr.readline()
            print( "FMTPROG: " + line.rstrip() )
            progressreg = re.compile('^(\d+) bytes transferred')
            m = progressreg.match( line )
            if m:
                progresssize = int( m.group(1) )
                if ( filesize > 0 ):
                    pct = float(progresssize) / float(filesize)
                    if pct > 1:
                        pct = 1
                    print( "COMPLETEPCT: " + str( pct ) )
            time.sleep(0.1)
    if hadError:
        sys.exit(1)
    else:
        command = "diskutil eject /dev/disk" + str( sdCardDev )
        print( "EJECTING: " + command )
        os.system( command )
        print( "COMPLETE" )
        
        
