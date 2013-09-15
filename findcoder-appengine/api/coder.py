# Coder for Raspberry Pi
# A simple platform for experimenting with web stuff.
# http://goo.gl/coder

# Copyright 2013 Google Inc. All Rights Reserved.

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#   http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import webapp2
import time
import re
import json
from google.appengine.api import memcache

CACHETIME = 120

class StatusHandler( webapp2.RequestHandler ):
    def post( self ):
        self.response.headers['Content-Type'] = 'text/json'
        external_ip = self.request.remote_addr
        internal_ip = self.request.get('ip')
        coder_name = self.request.get('coder_name')
        network = self.request.get('network')

        result = {}
        error = False

        validip = re.compile('^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$')
        if ( internal_ip is None or internal_ip == "" or validip.match( internal_ip ) is None ):
            result['status'] = 'error'
            result['error'] = 'no internal ip';
            result['info'] = 'ip: ' + external_ip + " ipinternal: " + internal_ip + " codername " + coder_name + " net " + network;
            error = True
        if ( coder_name is None or coder_name == "" ):
            result['status'] = 'error'
            result['error'] = 'no coder name';
            result['info'] = 'ip: ' + external_ip + " ipinternal: " + internal_ip + " codername " + coder_name + " net " + network;
            error = True
        if ( network is None ):
            result['status'] = 'error'
            result['error'] = 'no network';
            result['info'] = 'ip: ' + external_ip + " ipinternal: " + internal_ip + " codername " + coder_name + " net " + network;
            error = True

        if ( not error ):
            result['status'] = 'success'
            key = 'codernets:%s' % external_ip
            #key = "test"
            rawdata = memcache.get(key)
            netdata = {}
            if ( rawdata is not None ):
                netdata = json.loads(rawdata)
            netdata[internal_ip] = {
                'ip': internal_ip,
                'ext': external_ip,
                'name': coder_name,
                'net': network,
                'up': int(time.time())
            }
            netdata = filterRecentCoders( netdata )
            memcache.set( key, json.dumps(netdata), CACHETIME )
        
        self.response.out.write( json.dumps(result) )


class ListHandler( webapp2.RequestHandler ):
    def get( self ):
        self.response.headers['Content-Type'] = 'text/json'
        external_ip = self.request.remote_addr
        netdata = {}
        key = 'codernets:%s' % external_ip
        #key = "test"
        rawdata = memcache.get(key)
        if ( rawdata is not None ):
            netdata = json.loads(rawdata)
        if ( netdata is None ):
            netdata = {}
        netdata = filterRecentCoders( netdata )
        coders = []
        for k,v in netdata.iteritems():
            coders.append(v)
        response = { 
            'devices': coders 
        }
        self.response.out.write( json.dumps(response) )


def filterRecentCoders( netdata ):
    newdata = {}
    cutoff = int(time.time()) - CACHETIME
    for k, v in netdata.iteritems():
        if ( v['up'] > cutoff ):
            newdata[k] = v
    return newdata

app = webapp2.WSGIApplication(
    [
        ('/api/coder/status', StatusHandler),
        ('/api/coder/list', ListHandler)
    ],
    debug=True
)
