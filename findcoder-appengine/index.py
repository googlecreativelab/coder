/**
 * Coder for Raspberry Pi
 * A simple platform for experimenting with web stuff.
 * http://goo.gl/coder
 *
 * Copyright 2013 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import os
import pickle
import webapp2
from google.appengine.ext.webapp import template

class IndexHandler( webapp2.RequestHandler ):

    def get( self ):
        self.response.headers['Content-Type'] = 'text/html'
        tmpl = os.path.join( os.path.dirname(__file__), 'views/index.html' )
        tmplvars = {
        }
        self.response.out.write( template.render( tmpl, tmplvars ) )

app = webapp2.WSGIApplication(
    [
        ('/', IndexHandler)
    ],
    debug=True
)
