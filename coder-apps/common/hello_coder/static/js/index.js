/*

Hello Coder!

You're looking at Javascript code.  Javascript is a programming
language that allows you to control how your application functions.
You can use javascript to respond to mouse clicks, perform
calculations, or animate things on the screen.

In this demo, we're using Javascript to create a bunch of random lines
on the screen and then wiggle them back a forth.

Look below for the "numLines" and "speed" variables. See if you can make
your program draw 100 lines at a time instead of 10. Can you make them
move a little faster?

If you're comfortable digging in, try and see if you can make the lines
draw further down the screen. Don't let the math scare you. In
computational art, math makes things awesome.

*/


var lines = []; // array of the all the animated line positions
var numLines = 10; // how many lines to draw
var speed = 0.4; // how fast should the lines animate
var $canvas; // canvas jquery object we're drawing to
var ctx; // canvas drawing context


// Fires when the page first loads
$(document).ready( function() {

    initialize();
    animate();

});

// This creates all the line data that will be
// used to draw each frame of the animation.
var initialize = function() {
    lines = [];
    $canvas = $("#animation");
    ctx = $canvas.get(0).getContext("2d");
    var w = $canvas.parent().width();
    var h = $canvas.parent().height();
    
    // Resize the canvas to fill the entire page
    $canvas.attr('width', w);
    $canvas.attr('height', h);
    
    // Make sure numLines isn't a crazy number
    if ( numLines > 10000 ) {
        numLines = 10000;
    }
    
    for ( var x=0; x < numLines; x++ ) {

        // top x position
        // randomly chosen across the width of the screen (plus 50px off to the sides)
        var tx = (Math.random() * (w+100)) - 50;

        // top y position
        var ty = -20;
        
        // bottom x position
        // randomly chosen plus or minus 250px of the top position
        var bx = tx + (Math.random() * 500) - 250;
        
        // bottom y position
        // random 180px to 680px from top of screen
        var by = 180 + (Math.random() * 500);
        
        // speed at which the bottom of the line moves
        // random between 0.01 and [speed]
        var lineSpeed = (Math.random() * (speed - 0.01)) + 0.01;
        
        // wrap up all the parameters for this line in a single object
        var line = { 
            tx: tx,
            bx: bx,
            ty: ty,
            by: by,
            speed: lineSpeed,
            opacity: .2,
            direction: Math.random() > .5? 1:-1 //random moving left (-1) or right (1)
        };
        
        // put the new line into our lines array
        lines.push( line );
    }
    
};


// This runs over an over, moving the line
// positions and drawing them to the screen.
var animate  = function() {
    
    // clear the screen from the previous step of the animation
    ctx.clearRect(0, 0, $canvas.width(), $canvas.height());

    // process each line in our array
    for ( var x=0; x<lines.length; x++ ) {
        line = lines[x];

        // draw the line in it's existing position
        ctx.beginPath();
        ctx.lineWidth = .8;
        ctx.strokeStyle = "rgba(255,255,255," + line.opacity + ")";
        ctx.moveTo( line.tx, line.ty );
        ctx.lineTo( line.bx, line.by );
        ctx.stroke();
        ctx.closePath();

        // randomly adjust opacity by up to +/- .05
        line.opacity += (Math.random() * .1) - .05;
        
        // opacity should be greater than 0 and less than .6
        if ( line.opacity < 0 ) {
            line.opacity = 0;
        } else if ( line.opacity > .6 ) {
            line.opacity = .6;
        }

        // move the bottom of the line in its direction of travel
        line.bx += Math.random() * line.speed * line.direction;
        
        // limit this movement so that the bottom 
        // doesn't drift further than 250px from the top
        // and change the direction if it does
        if ( line.bx < line.tx - 250 ) {
            line.bx = line.tx - 250;
            line.direction=1;
        } else if ( line.bx > line.tx + 250 ) {
            line.bx = line.tx + 250;
            line.direction = -1;
        }
    }
    
    //have the browser run this animation just before each screen refresh
    requestAnimationFrame( animate );
};

