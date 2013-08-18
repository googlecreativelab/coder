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


/*
--------------------------------------------------

    Shims

--------------------------------------------------
*/

if ( !Date.now ) { Date.now = function now() { return +( new Date() ); }; }

/**
 * requestAnimationFrame polyfill by Erik Möller
 * Fixes from Paul Irish and Tino Zijdel
 *
 * @see http://goo.gl/ZC1Lm
 * @see http://goo.gl/X0h6k
 */

(function(){for(var d=0,a=["ms","moz","webkit","o"],b=0;b<a.length&&!window.requestAnimationFrame;++b)window.requestAnimationFrame=window[a[b]+"RequestAnimationFrame"],window.cancelAnimationFrame=window[a[b]+"CancelAnimationFrame"]||window[a[b]+"CancelRequestAnimationFrame"];window.requestAnimationFrame||(window.requestAnimationFrame=function(b){var a=Date.now(),c=Math.max(0,16-(a-d)),e=window.setTimeout(function(){b(a+c)},c);d=a+c;return e});window.cancelAnimationFrame||(window.cancelAnimationFrame=function(a){clearTimeout(a)})})();

/* Simple JavaScript Inheritance
 * By John Resig http://ejohn.org/
 * MIT Licensed.
 */

(function(){var a=!1,b=/xyz/.test(function(){})?/\b_super\b/:/.*/;this.Class=function(){},Class.extend=function(c){function g(){!a&&this.init&&this.init.apply(this,arguments)}var d=this.prototype;a=!0;var e=new this;a=!1;for(var f in c)e[f]="function"==typeof c[f]&&"function"==typeof d[f]&&b.test(c[f])?function(a,b){return function(){var c=this._super;this._super=d[a];var e=b.apply(this,arguments);return this._super=c,e}}(f,c[f]):c[f];return g.prototype=e,g.prototype.constructor=g,g.extend=arguments.callee,g}})();

/*
--------------------------------------------------

    Geometry

--------------------------------------------------
*/

var Vector = Class.extend({

    init: function( x, y ) {
        
        this.set( x, y );
    },

    set: function( x, y ) {
        
        this.x = x || 0.0;
        this.y = y || 0.0;

        return this;
    },

    add: function( vector ) {
        
        this.x += vector.x;
        this.y += vector.y;

        return this;
    },

    sub: function( vector ) {
        
        this.x -= vector.x;
        this.y -= vector.y;

        return this;
    },

    div: function( scalar ) {

        this.x /= scalar;
        this.y /= scalar;

        return this;
    },

    scale: function( scalar ) {

        this.x *= scalar;
        this.y *= scalar;

        return this;
    },

    min: function( vector ) {

        this.x = Math.min( this.x, vector.x );
        this.y = Math.min( this.y, vector.y );

        return this;
    },

    max: function( vector ) {

        this.x = Math.max( this.x, vector.x );
        this.y = Math.max( this.y, vector.y );

        return this;
    },

    rotate: function( radians, pivot ) {

        pivot = pivot || new Vector();

        var sin = Math.sin( radians );
        var cos = Math.cos( radians );

        dx = this.x - pivot.x;
        dy = this.y - pivot.y;

        this.x = cos * dx - sin * dy + pivot.x;
        this.y = sin * dx + cos * dy + pivot.y;

        return this;
    },

    mag: function() {

        return Math.sqrt( this.x * this.x + this.y * this.y );
    },

    magSq: function() {

        return this.x * this.x + this.y * this.y;
    },

    angle: function() {

        return Math.atan2( this.y, this.x );
    },

    copy: function( vector ) {

        this.set( vector.x, vector.y );
    },

    clone: function() {

        return new Vector( this.x, this.y );
    }

});

var Edge = Class.extend({

    init: function( a, b ) {

        this.a = a || new Vector();
        this.b = b || new Vector();
    },

    intersects: function( other, ray ) {

        if ( ray == null ) ray = false;

        var dy1 = this.b.y - this.a.y;
        var dx1 = this.b.x - this.a.x;
        var dx2 = this.a.x - other.a.x;
        var dy2 = this.a.y - other.a.y;
        var dx3 = other.b.x - other.a.x;
        var dy3 = other.b.y - other.a.y;

        if ( dy1 / dx1 !== dy3 / dx3 ) {

            var d = dx1 * dy3 - dy1 * dx3;

            if ( d !== 0 ) {

                var r = (dy2 * dx3 - dx2 * dy3) / d;
                var s = (dy2 * dx1 - dx2 * dy1) / d;

                if ( r >= 0 && ( ray || r <= 1 ) ) {

                    if ( s >= 0 && s <= 1 ) {
                        
                        //return new Vector( this.a.x + r * dx1, this.a.y + r * dy1 );
                        return true;
                    }
                }
            }
        }

        return false;
    }
});

var Polygon = Class.extend({

    init: function( vertices, edges ) {

        this.vertices = vertices || [];
        this.edges = edges || [];

        this.center = new Vector();
        this.bounds = {
            min: new Vector(),
            max: new Vector()
        };

        this.computeBounds();
        this.computeCenter();
        this.computeEdges();
    },

    translate: function( vector ) {

        var i, n;

        for ( i = 0, n = this.vertices.length; i < n; i++ ) {
            this.vertices[i].add( vector );
        }

        this.bounds.min.add( vector );
        this.bounds.max.add( vector );
        this.center.add( vector );
    },

    rotate: function( radians, pivot ) {

        pivot = pivot || this.center;

        for ( var i = 0, n = this.vertices.length; i < n; i++ ) {
            this.vertices[i].rotate( radians, pivot );
        }

        this.computeBounds();
    },

    scale: function( amount ) {

        var vertex;

        for ( var i = 0, n = this.vertices.length; i < n; i++ ) {
            
            vertex = this.vertices[i];
            delta = vertex.clone().sub( this.center );
            delta.scale( amount - 1.0 );
            vertex.add( delta );
        }

        this.computeBounds();
    },

    computeCenter: function() {

        this.center.set();

        for ( var i = 0, n = this.vertices.length; i < n; i++ ) {
            this.center.add( this.vertices[i] );
        }

        return this.center.div( n );
    },

    computeBounds: function() {

        this.bounds.min.set( Number.MAX_VALUE, Number.MAX_VALUE );
        this.bounds.max.set( -Number.MAX_VALUE, -Number.MAX_VALUE );

        var i, n, vertex;

        for ( i = 0, n = this.vertices.length; i < n; i++ ) {
            
            vertex = this.vertices[i];
            this.bounds.min.min( vertex );
            this.bounds.max.max( vertex );
        }

        return this.bounds;
    },

    computeEdges: function() {

        this.edges.length = 0;

        var i, n, edge;

        for ( i = 0, n = this.vertices.length; i < n; i++ ) {

            edge = new Edge( this.vertices[i], this.vertices[ (i + 1) % this.vertices.length ] );
            this.edges.push( edge );
        }

        return this.edges;
    },

    intersects: function( other ) {

        if ( other.bounds.min.x > this.bounds.max.x || other.bounds.min.y > this.bounds.max.y ) return false;
        if ( other.bounds.max.x < this.bounds.min.x || other.bounds.max.y < this.bounds.min.y ) return false;

        var i, j, n, m, edge;

        for ( i = 0, n = this.edges.length; i < n; i++ ) {

            edge = this.edges[i];

            for ( j = 0, m = other.edges.length; j < m; j++ ) {
                
                if ( edge.intersects( other.edges[j] ) ) return true;
            }
        }

        return false;
    },

    contains: function( vector ) {

        if ( vector.x > this.bounds.max.x || vector.x < this.bounds.min.x ) return false;
        if ( vector.y > this.bounds.max.y || vector.y < this.bounds.min.y ) return false;

        var minX = function(o) { return o.x; };
        var minY = function(o) { return o.y; };

        var outside = new Vector(
            Math.min.apply( Math, this.vertices.map( minX ) ) - 1,
            Math.min.apply( Math, this.vertices.map( minY ) ) - 1);

        var ray = new Edge( vector, outside );
        var intersections = 0;

        for ( var i = 0, n = this.edges.length; i < n; i++ ) {
            
            if ( ray.intersects( this.edges[i], true ) ) {
                intersections++;
            }
        }

        return !!( intersections % 2 );
    },

    wrap: function( x1, y1, x2, y2 ) {

        var ox = ( this.bounds.max.x - this.bounds.min.x ) + ( x2 - x1 );
        var oy = ( this.bounds.max.y - this.bounds.min.y ) + ( y2 - y1 );

        var offset = new Vector();

        if ( this.bounds.max.x < x1 ) offset.x = ox;
        else if ( this.bounds.min.x > x2 ) offset.x = -ox;

        if ( this.bounds.max.y < y1 ) offset.y = oy;
        else if ( this.bounds.min.y > y2 ) offset.y = -oy;

        if ( offset.x !== 0 || offset.y !== 0 ) {
            this.translate( offset );
        }
    },

    draw: function( ctx ) {

        var i, n, vertex = this.vertices[0];

        ctx.beginPath();
        ctx.moveTo( vertex.x, vertex.y );

        for ( i = 1, n = this.vertices.length; i < n; i++ ) {
            vertex = this.vertices[i];
            ctx.lineTo( vertex.x, vertex.y );
        }

        ctx.closePath();
    },

    drawBounds: function( ctx ) {

        ctx.beginPath();
        ctx.circle( this.center.x, this.center.y, 5 );
        ctx.rect( this.bounds.min.x, this.bounds.min.y, this.bounds.max.x - this.bounds.min.x, this.bounds.max.y - this.bounds.min.y);
        ctx.closePath();
    }
});

/*
--------------------------------------------------

    Game2D

--------------------------------------------------
*/

var Game2D = Game2D || (function() {

    var game;

    var keynames = {
        8:  'BACKSPACE',
        9:  'TAB',
        13: 'ENTER',
        16: 'SHIFT',
        27: 'ESCAPE',
        32: 'SPACE',
        37: 'LEFT',
        38: 'UP',
        39: 'RIGHT',
        40: 'DOWN'
    };

    // Global references
    var globals = {

        PI         : Math.PI,
        TWO_PI     : Math.PI * 2,
        HALF_PI    : Math.PI / 2,
        QUARTER_PI : Math.PI / 4,

        E: Math.E,
        LN2: Math.LN2,
        LN10: Math.LN10,
        LOG2E: Math.LOG2E,
        LOG10E: Math.LOG10E,
        SQRT1_2: Math.SQRT1_2,
        SQRT2: Math.SQRT2,
        abs: Math.abs,
        acos: Math.acos,
        asin: Math.asin,
        atan: Math.atan,
        atan2: Math.atan2,
        ceil: Math.ceil,
        cos: Math.cos,
        exp: Math.exp,
        floor: Math.floor,
        log: Math.log,
        max: Math.max,
        min: Math.min,
        pow: Math.pow,
        round: Math.round,
        sin: Math.sin,
        sqrt: Math.sqrt,
        tan: Math.tan,

        random: function( min, max ) {

            if ( min && typeof min.length === 'number' && !!min.length )
                return min[ Math.floor( Math.random() * min.length ) ];

            if ( typeof max !== 'number' )
                max = min || 1, min = 0;

            return min + Math.random() * (max - min);
        },

        chance: function( probability ) {

            if ( typeof probability !== 'number' ) probability = 0.5;
            return Math.random() < probability;
        }
    };

    // Default game options
    var defaults = {

        autoclear: true,
        autostart: true,
        container: document.body,
        height: 0,
        width: 0
    };

    // Game API
    var gameAPI = {

        running: false,
        millis: 0,
        now: NaN,
        dt: NaN,

        __init: function() {

            bindAll( this );
            
            on( document, 'keydown', this.__keydown );
            on( document, 'keyup', this.__keyup );
            on( window, 'resize', this.__resize );

            this.__resize();
            this.init();

            var loop;
            var _this = this;
            
            (loop = function() {
                
                if ( _this.running ) _this.__update();
                requestAnimationFrame( loop );

            })();
        },

        __resize: function() {

            this.canvas.height = this.height = this.container.clientHeight;
            this.canvas.width = this.width = this.container.clientWidth;
            this.resize();
        },

        __keydown: function( event ) {

            this[ map( event.keyCode ) ] = true;
            this[ event.keyCode ] = true;
        },

        __keyup: function( event ) {

            this[ map( event.keyCode ) ] = false;
            this[ event.keyCode ] = false;
            this.keypressed( map( event.keyCode ) );
        },

        __update: function() {

            var now = Date.now();
            this.dt = now - this.now;
            this.millis += this.dt;
            this.now = now;

            if ( this.autoclear ) this.clear();
            this.update();
            this.draw();
        },

        clear: function() {
            this.canvas.width = this.canvas.width;
        },

        start: function() {

            this.now = Date.now();
            this.running = true;
        },

        stop: function() {

            this.running = false;
        },

        // Override
        init: function() {},
        draw: function() {},
        update: function() {},
        resize: function() {},
        keypressed: function() {}
    };

    // Graphics API
    var graphicsAPI = {
        
        line: function( x1, y1, x2, y2 ) {
            
            this.moveTo( x1, y1 );
            this.lineTo( x2, y2 );
        },

        rect: function( x, y, width, height ) {
            
            this.moveTo( x, y );
            this.lineTo( x + width, y );
            this.lineTo( x + width, y + height );
            this.lineTo( x, y + height );
            this.lineTo( x, y );
        },

        circle: function( x, y, radius ) {

            this.moveTo( x + radius, y );
            this.arc( x, y, radius, 0, TWO_PI );
        }
    };

    // Helpers

    function extend( child, parent, overwrite ) {

        for ( var key in parent ) {

            if ( !child.hasOwnProperty( key ) || overwrite ) {
                child[ key ] = parent[ key ];
            }
        }

        return child;
    }

    function isArray( obj ) {
        return Object.prototype.toString.call( obj ) === "[object Array]";
    }

    function on( target, event, handler ) {
        
        target.addEventListener( event, handler, false );
    }

    function off( target, event, handler ) {

        target.removeEventListener( event, handler );
    }

    function bind( method, scope ) {

        return function() {
            method.apply( scope, Array.prototype.slice.call( arguments ) );
        };
    }

    function bindAll( scope ) {

        var key, val;

        for ( key in scope ) {
            
            val = scope[ key ];

            if ( typeof val === 'function' ) {
                scope[ key ] = bind( val, scope );
            }
        }
    }

    // maps a key code to a key name
    function map( code ) {
        return keynames[ code ] || String.fromCharCode( code );
    }

    // Methods
    function create( options ) {

        extend( options || {}, defaults, false );

        game = {};
        game.canvas = document.createElement( 'canvas' );
        game.graphics = extend( game.canvas.getContext( '2d' ), graphicsAPI );

        for ( var name in keynames ) {
            game[ keynames[ name ] ] = false;
        }

        extend( self, globals, false );
        extend( game, gameAPI, false );
        extend( game, options, true );

        game.container.appendChild( game.canvas );

        game.__init();

        if ( game.autostart ) {
            game.start();
        }

        return game;
    }

    // API

    return {
        create: create
    };

})();

