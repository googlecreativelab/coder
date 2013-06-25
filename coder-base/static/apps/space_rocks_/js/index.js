
var MEDIA_PATH = staticurl + '/media/';

var snippeteditor;
var gamecontainer;
var firstColorError = true;
var SpaceRocks;

$(document).ready( function() {
    
    gamecontainer = $( '#gamecontainer' );
    snippeteditor = setupEditor( "snippetcode", '', "ace/mode/javascript" );

    // Toggle game when editing

    snippeteditor.on( 'focus', function() {
        if ( SpaceRocks ) SpaceRocks.stop();
    });

    snippeteditor.on( 'blur', function() {
        if ( SpaceRocks ) SpaceRocks.start();
    });
   
    $("#closepanel").click( function(){
        //ConsoleTerminal.print( "close tools\n" );
        //setTimeout( closeTools, 1000 );
        closeTools();
    });
    
    $("#opentools").click( function(){
        openTools();
    });
    
    // $("#testcode").click(function(){
    //     ConsoleTerminal.print( "test\n" );
    //     setTimeout( runTest, 1000 );
    // });

    

    // Initialize game
    GameCode.container = gamecontainer.get(0);
    SpaceRocks = Game2D.create( GameCode );

    configureEditor({
        target: 'SpaceRocks',
        comment: 'Try changing the variables below and see how they affect the game',
        props: [
            'projectileColor',
            'projectileSpeed',
            'enemyColors',
            'shipColor',
            'lineThickness',
            'outlineShapes',
            'fillShapes'
        ]
    },{
        target: 'SpaceRocks.ship',
        comment: 'The 3 letter name for your ship and high scores',
        props: [
            'name'
        ]
    },{
        target: 'SpaceRocks.ship',
        comment: 'Ship properties',
        props: [
            'speed',
            'size',
            'drag'
        ]
    });
    
    /*
    setTimeout( function() {
        $('#opentools_tip').fadeIn('fast').delay(5000).fadeOut('fast');
    }, 800 );
    */

});

var closeTools = function() {
    $('body').addClass('tools_closed');
    
    $('#opentools_tip').hide();

    // Ensure the game knows about dimension changes
    setTimeout( function() {
        SpaceRocks.__resize();
    }, 500 );
};

var openTools = function() {
    $('body').removeClass('tools_closed');
    $('.terminal').blur();
    $('.terminal').focus();

    // Ensure the game knows about dimension changes
    setTimeout( function() {
        SpaceRocks.__resize();
    }, 500 );
};



var setupEditor = function( editorid, data, editmode ) {

    $("#" + editorid).text( data );
    var editor = ace.edit( editorid );
    editor.setTheme( "ace/theme/coder" );
    editor.getSession().setMode(editmode);
    editor.setBehavioursEnabled( false );
    editor.gotoLine(1);
    
    var revert = editor.getValue();
    $('#' + editorid).css('font-size', '16px');
    return editor;
};


var configureEditor = function() {

    var descriptors = [].slice.call( arguments, 0 );
    var code = [];
    var i, n, obj, key, val;

    for ( i = 0, n = descriptors.length; i < n; i++ ) {

        obj = descriptors[i];
        code.push( '', '// ' + obj.comment );

        for ( j = 0, m = obj.props.length; j < m; j++ ) {

            key = obj.target + '.' + obj.props[j];
            
            try {

                val = eval( key );
                code.push( key + ' = ' + JSON.stringify( val ) + ';' );

            } catch( error ) {}
        }
    }

    var original = code.join( '\n' );
    var $reset = $( '#resetcode' );
    var saveTimeout = -1;

    var reset = function() {
        
        snippeteditor.setValue( original );
        snippeteditor.gotoLine(1);
    };

/*
    Coder.loadData( 'spacerocks:data', function( result ) {
        
        if ( result && result.data ) {

            console.log( 'LOAD DATA', result );
            
            SpaceRocks.data = JSON.parse( result.data );

            if ( SpaceRocks.data.code && SpaceRocks.data.code !== snippeteditor.getValue() ) {
                snippeteditor.setValue( SpaceRocks.data.code );
                snippeteditor.gotoLine(1);
            }
        }
    });
*/

    

    var saveCode = function() {

        SpaceRocks.data.code = snippeteditor.getValue();
        var data = JSON.stringify( SpaceRocks.data );

        /*
        Coder.saveData( 'spacerocks:data', data, function() {
            console.log( 'SAVE DATA', 'spacerocks:data', +new Date, data );
        });
        */
    };

    var test = function() {
        
        try {
            
            eval( snippeteditor.getValue() );
            SpaceRocks.clear();
            SpaceRocks.draw();

            clearTimeout( saveTimeout );
            saveTimeout = setTimeout( saveCode, 1500 );

        } catch( error ) {}
    };

    snippeteditor.getSession().on( 'change', test );
    $reset.on( 'click', reset );

    reset();
};

/*
--------------------------------------------------

    Game Code

--------------------------------------------------
*/

var Entity = Polygon.extend({

    init: function( vertices ) {

        this.angularVelocity = 0.0;
        this.velocity = new Vector();
        this.heading = new Vector(1,0);
        this.drag = 0.0;
        this.age = 0.0;

        this._super( vertices );
    },

    reset: function() {
        
        this.angularVelocity = 0.0;
        this.velocity.set( 0, 0 );
        this.heading.set( 1, 0 );
        this.drag = 0.0;
        this.age = 0.0;
    },

    turn: function( radians ) {

        this.heading.rotate( radians );
        this.rotate( radians );
    },

    move: function( amount ) {
        
        this.velocity.add( this.heading.clone().scale( amount ) );
    },

    update: function( dt ) {

        var viscosity = 1.0 - this.drag * dt;

        this.translate( this.velocity.clone().scale( dt ) );
        this.rotate( this.angularVelocity * dt );
        
        this.angularVelocity *= viscosity;
        this.velocity.scale( viscosity );

        this.age += dt;
    }
});

var Asteroid = Entity.extend({

    init: function( generation ) {

        generation = generation || 1;

        this.generation = generation;
        this.seed = Math.random();

        this._super((function() {

            var vertices = [];
            var sides = random( 4, 12 );
            var step = TWO_PI / sides;

            for ( var i = 0; i < sides - 1; i++ ) {

                var theta = (step * i) + random( step );
                var radius = random( 40, 80 ) / generation;
                var vertex = new Vector( cos( theta ) * radius, sin( theta ) * radius );

                vertices.push( vertex );
            }

            return vertices;

        })());

        this.angularVelocity = random( 0.5, 1.0 ) * ( chance() ? -1 : 1 );
        this.velocity.x = random( 30, 60 ) * ( chance() ? -1 : 1 );
        this.velocity.y = random( 30, 60 ) * ( chance() ? -1 : 1 );
    },

    split: function() {

        var child1 = new Asteroid( this.generation + 1 );
        var child2 = new Asteroid( this.generation + 1 );

        child1.translate( this.center );
        child2.translate( this.center );

        child1.seed = this.seed;
        child2.seed = this.seed;

        return [ child1, child2 ];
    }
});

var Ship = Entity.extend({

    init: function() {

        this._super([]);

        this.invincible = false;
        this.thrusting = false;
        this.speed = 3.0;
        this.drag = 0.5;
        this.name = 'You';

        this._size = 1.0;
        this.size = 1.0;

        this.reset();
    },

    reset: function() {

        var xo = 15 * this.size;
        var yo = 12 * this.size;

        this.vertices = [
            new Vector( -xo, -yo ),
            new Vector( xo, 0 ),
            new Vector( -xo, yo )
        ];

        this.computeBounds();
        this.computeCenter();
        this.computeEdges();

        this._super();
    },

    draw: function( ctx ) {

        this.size = Math.max( 0.1, Math.min( 10, this.size ) );

        if ( this.size !== this._size ) {

            this.scale( 1 / this._size );
            this.scale( this._size = this.size );
        }

        ctx.save();

        var name = this.name.substr(0,3).toUpperCase();

        ctx.translate( this.center.x, this.center.y );
        ctx.globalAlpha = 1.0;
        ctx.textBaseline = 'top';
        ctx.textAlign = 'center';
        ctx.font = '12px Courier';
        ctx.fillStyle = '#fff'
        ctx.fillText( name, 0, 35 * this.size );

        if ( this.thrusting ) {
            
            ctx.globalAlpha = sin( ( +new Date() ) * 0.03 ) + 1.0;
            ctx.rotate( this.heading.angle() - Math.PI );
            ctx.translate( 15 * this.size, 0 );
            ctx.beginPath();
            ctx.moveTo( 0, -3 * this.size );
            ctx.lineTo( 8 * this.size, 0 );
            ctx.lineTo( 0, 3 * this.size );
            ctx.closePath();
            ctx.stroke();
        }

        ctx.restore();

        this._super( ctx );
    }
});

var Projectile = Entity.extend({

    init: function() {

        this._super([
            new Vector()
        ]);
    },

    draw: function( ctx ) {

        ctx.beginPath();
        ctx.circle( this.vertices[0].x, this.vertices[0].y, 4 );
        ctx.closePath();
    }
});

var Pool = Class.extend({

    init: function( size ) {

        this.size = size;
        this.queue = [];
    },

    pop: function() {

        if ( !!this.queue.length ) {
            return this.queue.pop();
        } else {
            return this.create();
        }
    },

    push: function( item ) {

        this.clean( item );
        this.queue.push( item );
    },

    create: function() {},
    clean: function( item ) {}
});

var Sound = Pool.extend({

    init: function( path ) {

        this._super();

        this.path = path;
    },

    play: function() {

        this.pop().play();
    },

    create: function() {

        var me = this;
        var audio = new Audio( this.path );

        audio.addEventListener( 'ended', function() {
            me.push( audio );
        }, false);

        return audio;
    },

    clean: function( item ) {

        item.currentTime = 0;
    }
});

var Loop = Class.extend({
    
    init: function( path ) {

        var me = this;

        this.track = new Audio( path );

        this.track.addEventListener( 'ended', function() {

            if ( me.playing ) {
                me.track.currentTime = 0;
                me.track.play();
            }

        }, false);

        this.playing = false;
    },

    play: function() {

        if ( !this.playing ) {
            
            this.playing = true;
            this.track.play();
        }
    },

    stop: function() {

        this.playing = false;
        this.track.pause();
    }
});

var STATES = {
    INTRO: 'intro',
    PLAYING: 'playing',
    GAME_OVER: 'game-over'
};

var SOUNDS = {
    DESTROY_VECTOROID: new Sound( MEDIA_PATH + 'die_spacerock.mp3' ),
    DESTROY_SHIP: new Sound( MEDIA_PATH + 'die_ship.mp3' ),
    SHOOT: new Sound( MEDIA_PATH + 'spacerocks_shoot.mp3' ),
    THRUST: new Loop( MEDIA_PATH + 'thrust.mp3' ),
    
    stop: function() {

        var key, val;
        
        for ( key in this ) {
            
            val = this[ key ];

            if ( typeof val.stop === 'function' ) {
                val.stop();
            }
        }
    }
};

var GameCode = {

    autostart: false,

    // Config
    drawBounds: false,
    backgroundColor: '#252525',
    projectileColor: '#C3FF68',
    enemyColors: [ '#FF4E50', '#E32551', '#FFC219', '#E42692' ],
    shipColor: '#00CDAC',
    textColor: '#FFFFFF',
    outlineShapes: true,
    fillShapes: true,
    lineThickness: 2,

    minAsteroids: 10,
    projectileSpeed: 400,
    maxProjectiles: 10,
    projectiles: [],
    spacerocks: [],
    canFire: true,
    state: '',
    score: 0,
    lives: 3,
    ship: new Ship(),
    data: {},

    init: function() {

        this.changeState( STATES.INTRO );

        $( '.start' ).on( 'click', this.onStartClicked );
        this.draw();
    },

    reset: function() {

        this.lives = 3;
        this.score = 0;
        this.spacerocks = [];
        this.projectiles = [];

        this.resetShip();
        this.stop();
    },

    changeState: function( state ) {

        this.state = state;

        // Update class

        var classes = this.container.className.split( ' ' );
        
        for ( var i = 0, n = classes.length; i < n; i++ ) {
            
            if ( /\bstate\-[^\s]+/gi.test( classes[i] ) ) {
                classes.splice(i,1);
                n--;
            }
        }

        classes.push( 'state-' + state );
        this.container.className = classes.join( ' ' );

        // Update game state

        switch ( this.state ) {

            case STATES.INTRO:

                $( '.title' ).text( 'Space Rocks!' );
                $( '.start' ).text( 'Start Game' );
                this.getScores();

                break;

            case STATES.PLAYING:

                if ( !this.running ) {
                    this.reset();
                    this.start();
                }

                break;

            case STATES.GAME_OVER:

                SOUNDS.stop();
                //SOUNDS.GAME_OVER.play();

                $( '.title' ).text( 'Game Over' );
                $( '.start' ).text( 'Play Again' );

                this.saveScores();
                this.showScores();
                this.lives = 0;
                this.stop();

                break;
        }
    },

    getScores: function() {

        var me = this;

        me.data = {};
        me.data.scores = me.data.scores || [{
            name: 'CDR',
            score: 1000
        }];
        me.showScores();

/*
        Coder.loadData( 'spacerocks:data', function( result ) {

            if ( typeof result.data !== 'undefined' && result.data != null  && result.data != "" ) {
                me.data = JSON.parse(result.data);
            } else {
                me.data = {};
            }
            me.data.scores = me.data.scores || [{
                name: 'CDR',
                score: 1000
            }];

            me.showScores();
        });
*/
    },

    saveScores: function() {

        this.data.scores.push({
            name: 'YOU',
            score: this.score
        });

        var data = JSON.stringify( this.data );
/*
        Coder.saveData( 'spacerocks:data', data, function() {
            console.log( 'saved data', 'spacerocks:data', +new Date, data );
        });
*/
    },

    showScores: function() {

        this.data.scores.sort( function( a, b ) {
            return b.score - a.score;
        });

        var scores = $( '.scores .players' ).empty();
        var entry, score;

        for ( var i = 0, n = Math.min( 10, this.data.scores.length ); i < n; i++ ) {

            score = this.data.scores[i];
            entry = $( '<li/>' );
            entry.html( score.score + '<span>' + score.name + '</span>' );
            scores.append( entry );
        }
    },

    resetShip: function() {
        
        this.ship.reset();
        this.ship.translate( new Vector( this.width / 2, this.height / 2 ) );
        this.ship.invincible = true;

        var me = this;

        setTimeout( function() {
            me.ship.invincible = false;
        }, 1500);
    },

    createAsteroid: function() {
        
        var spacerock = new Asteroid();

        var x = random( this.width * 0.25 );
        var y = random( this.height * 0.25 );
        
        if ( chance() ) x = this.width - x;
        if ( chance() ) y = this.height - y;

        spacerock.translate( new Vector( x, y ) );
        this.spacerocks.push( spacerock );
    },

    destroyAsteroid: function( spacerock ) {

        SOUNDS.DESTROY_VECTOROID.play();

        var index = this.spacerocks.indexOf( spacerock );

        if ( index > -1 ) {
            
            this.spacerocks.splice( index, 1 );
            
            if ( spacerock.generation < 3 ) {
                this.spacerocks = this.spacerocks.concat( spacerock.split() );
            }
        }
    },

    update: function() {

        var dtSeconds = this.dt / 1000;
        var i, j, n, m, spacerock, projectile;

        // Update spacerocks

        while ( this.spacerocks.length < this.minAsteroids ) {
            this.createAsteroid();
        }

        for ( i = 0, n = this.spacerocks.length; i < n; i++ ) {

            spacerock = this.spacerocks[i];
            spacerock.wrap( 0, 0, this.width, this.height );
            spacerock.update( dtSeconds );
        }

        // Update projectiles

        for ( i = 0, n = this.projectiles.length; i < n; i++ ) {

            projectile = this.projectiles[i];

            if ( projectile.age < 2 ) {

                projectile.wrap( 0, 0, this.width, this.height );
                projectile.update( dtSeconds );

            } else {

                this.projectiles.splice(i,1);
                n--;
            }
        }

        // Update ship

        if ( this.LEFT ) {
            this.ship.turn( -0.07 );
        }

        if ( this.RIGHT ) {
            this.ship.turn( 0.07 );
        }

        if ( this.UP ) {

            SOUNDS.THRUST.play();
            this.ship.move( this.ship.speed );
            this.ship.thrusting = true;

        } else {

            SOUNDS.THRUST.stop();
            this.ship.thrusting = false;
        }

        if ( this.SPACE && this.canFire && this.projectiles.length < this.maxProjectiles ) {

            var me = this;

            // Play sound
            SOUNDS.SHOOT.play();

            // Create a new projectile

            projectile = new Projectile();
            projectile.translate( this.ship.vertices[1] );
            projectile.velocity.copy( this.ship.heading );
            projectile.velocity.scale( this.projectileSpeed );
            
            this.projectiles.push( projectile );

            // Disable firing temporarily
            setTimeout( function() { me.canFire = true; }, 100 );
            me.canFire = false;
        }

        this.ship.wrap( 0, 0, this.width, this.height );
        this.ship.update( dtSeconds );
    },

    draw: function() {

        var shipColor = this.shipColor;
        var i, j, n, m, color, spacerock, projectile, child1, child2;

        this.container.style.backgroundColor = this.backgroundColor;
        this.container.style.color = this.textColor;

        // Draw spacerocks

        this.graphics.lineWidth = min( 10, max( 0, abs( this.lineThickness ) ) );
        this.graphics.globalCompositeOperation = 'lighter';

        for ( i = 0, n = this.spacerocks.length; i < n; i++ ) {

            spacerock = this.spacerocks[i];

            color = this.enemyColors[ spacerock.seed * this.enemyColors.length | 0 ];

            this.graphics.strokeStyle = color;
            this.graphics.fillStyle = color;

            // Check for spacerock-projectile collision

            for ( j = 0, m = this.projectiles.length; j < m; j++ ) {

                projectile = this.projectiles[j];

                // If projectile is hitting spacerock

                if ( spacerock.contains( projectile.vertices[0] ) ) {

                    this.score += 20;
                    
                    this.projectiles.splice( j, 1 );
                    this.destroyAsteroid( spacerock );

                    n = this.spacerocks.length;
                    m = this.projectiles.length;

                    break;
                }
            }

            // Check for spacerock-ship collision

            if ( !this.ship.invincible && this.ship.intersects( spacerock ) ) {

                if ( this.lives <= 1 ) {

                    this.changeState( STATES.GAME_OVER );

                } else {

                    SOUNDS.DESTROY_SHIP.play();

                    this.destroyAsteroid( spacerock );
                    n = this.spacerocks.length;
                    
                    this.resetShip();
                    this.lives--;
                }
            }

            spacerock.draw( this.graphics );
            
            if ( this.fillShapes ) {
                this.graphics.globalAlpha = 0.5;
                this.graphics.fill();
            }

            if ( this.outlineShapes ) {
                this.graphics.globalAlpha = 0.8;
                this.graphics.stroke();
            }

            if ( this.drawBounds ) {

                spacerock.drawBounds( this.graphics );
                this.graphics.globalAlpha = 0.5;
                this.graphics.stroke();
            }
        }

        // Draw projectiles

        this.graphics.fillStyle = this.projectileColor;

        for ( i = 0, n = this.projectiles.length; i < n; i++ ) {

            projectile = this.projectiles[i];
            projectile.draw( this.graphics );
            this.graphics.fill();
        }

        // Draw ship

        var alphaMultiplier = this.ship.invincible ? abs( sin( this.millis * 0.005 ) ) : 1.0;
        this.graphics.strokeStyle = this.shipColor;
        this.graphics.fillStyle = this.shipColor;

        this.ship.draw( this.graphics );

        if ( this.fillShapes ) {
            this.graphics.globalAlpha = 0.8 * alphaMultiplier;
            this.graphics.fill();
        }

        if ( this.outlineShapes ) {
            this.graphics.globalAlpha = 1.0 * alphaMultiplier;
            this.graphics.stroke();
        }

        if ( this.drawBounds ) {
            
            this.ship.drawBounds( this.graphics );
            this.graphics.globalAlpha = 0.5;
            this.graphics.stroke();
        }

        // Update stats

        $( '.score' ).text( this.score );
        $( '.lives' ).text( this.lives );
    },

    keypressed: function( key ) {
        if ( key === 'X' ) {
            if ( this.running ) this.stop();
            else this.start();
        }
    },

    // Event handlers

    onStartClicked: function( event ) {

        event.preventDefault();
        this.reset();
        this.changeState( 'playing' );
    }
};
