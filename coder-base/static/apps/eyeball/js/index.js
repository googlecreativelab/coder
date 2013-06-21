
$(document).ready( function() {

    var centered = document.getElementsByClassName( 'center' );
    var eyes = document.getElementsByClassName( 'eye' );
    var eyeRadius = 100;
    var mouseX = 0.0;
    var mouseY = 0.0;

    // Returns the pixel value of a number, e.g '42px'
    function toPixels( number ) {
        return Math.round( number ) + 'px';
    }

    // Applies the CSS3 blink animation to the eyes
    function blink() {

        for ( var i = 0; i < eyes.length; i++ ) {

            var eye = eyes[i];
            var container = eye.getElementsByClassName( 'container' )[0];
            container.style.webkitAnimation = '';

            // Since the animation property was already present on the element,
            // we need to wait until the next frame to add it back so that it
            // registers as a change
            setTimeout( function() {
                container.style.webkitAnimation = 'blink 500ms ease-in-out';
            }, 0);
        }

        setTimeout( blink, 4000 + Math.random() * 5000 );
    }

    function updateEyes() {

        for ( var i = 0; i < eyes.length; i++ ) {

            var eye = eyes[i];
            var eyeBounds = eye.getBoundingClientRect();

            // Find the angle from the mouse to the center of the eye...

            // Then subract the eye center from them
            var deltaX = mouseX - eyeBounds.left - eyeRadius;
            var deltaY = mouseY - eyeBounds.top - eyeRadius;

            // Now find the angle
            var angle = Math.atan2( deltaY, deltaX );

            // Compute the distance using Pythagorean theorem: a^2 + b^2 = c^2
            var distance = Math.sqrt( deltaX * deltaX + deltaY * deltaY );

            // Limit the distance to the radius of the eye
            var offset = Math.min( distance, eyeRadius * 0.6 );

            // Now position the iris
            var xPos = Math.cos( angle ) * offset;
            var yPos = Math.sin( angle ) * offset;

            // Move the iris
            var iris = eye.getElementsByClassName( 'iris' )[0];
            iris.style.left = toPixels( eyeRadius + xPos );
            iris.style.top = toPixels( eyeRadius + yPos );
        }
    }

    // Center all elements with the `centered` class
    for ( var i = 0; i < centered.length; i++ ) {

        var obj = centered[i];
        obj.style.marginTop = toPixels( obj.clientHeight * -0.5 );
        obj.style.marginLeft = toPixels( obj.clientWidth * -0.5 );
    }

    // Handle mousemove events
    document.addEventListener( 'mousemove', function( event ) {

        // Update the mouse position
        mouseX = event.clientX;
        mouseY = event.clientY;

        updateEyes();
    });

    updateEyes();
    blink();

});