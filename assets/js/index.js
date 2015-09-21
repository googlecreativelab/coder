var animatingScroll = false;

$(document).ready( function() {

    $('.setup.switch .wifi').click(function(){
        $(this).parent().children().removeClass('active');
        $(this).addClass('active');
        $('.setup .switchpanel').removeClass('active');
        $('.setup .switchpanel.wifi').addClass('active');
    });
    $('.setup.switch .wired').click(function(){
        $(this).parent().children().removeClass('active');
        $(this).addClass('active');
        $('.setup .switchpanel').removeClass('active');
        $('.setup .switchpanel.wired').addClass('active');
    });


    //wifi by default
    $('.setup.switch .wired').click();


    $(window).scroll( function() {
        update_nav_pos();
        updateNav();
    });
    update_nav_pos();

    buildAnimation();
    updateLines();
    $(window).on('resize', function() {
        setTimeout( buildAnimation, 1 );
        //size is no longer window width dependant
        //updateVideoSize();
    });


    //smooth scroll anchors
    $('a.animate').click(function(ev){
        ev.preventDefault();
        animatingScroll = true;
        $('a').removeClass('active');
        $(this).addClass('active');
        if ( $(this).attr('data-navtarget') != null ) {
            $("#nav_" + $(this).attr('data-navtarget')).addClass('active');
        }
        $('html,body').animate({
            scrollTop: $('[name="' + $.attr(this, 'href').substr(1) + '"]').offset().top
        }, 400, function() {
            animatingScroll = false;
            updateNav();
        });
    });


    //open faqs on click
    var faqdown = function() {
        $(this).parent().find('p').slideDown();
        $(this).unbind('click', faqdown).bind('click', faqup);
    };
    var faqup = function() {
        $(this).parent().find('p').slideUp();
        $(this).unbind('click', faqup).bind('click', faqdown);
    };
    $('.faq.rollup h3').bind('click', faqdown);


    //video replace on image click
    $('#introvideo').bind( 'click', addVideo );


    buildTour();

});


var buildTour = function() {
    var $tourslides = $('.tour .slide');
    $tourslides.css('visibility','visible').hide();
    for ( var x=0; x< $tourslides.length; x++ ) {
        var $navitem = $('<div class="item" data-slide="slide_' + x + '">');
        $('.tournav').append( $navitem );
        $($tourslides.get(x)).attr('data-slide', 'slide_' + x);
        if ( x+1 >= $tourslides.length ) {
            $($tourslides.get(x)).attr('data-next', 'slide_0');
        } else {
            $($tourslides.get(x)).attr('data-next', 'slide_' + (x+1));
        }
        $navitem.bind('click', function()  {
            activateSlide(this);
        });
        $($tourslides.get(x)).find('img').bind('click', function() {
            activateSlide( $('.tour .slide[data-slide="' +  $(this).parent().attr('data-next') + '"]' ) );
        });
    }
    activateSlide( $tourslides.get(0) );
};
var activateSlide = function( item ) {
    $item = $(item);
    $slide = $('.tour .slide[data-slide="' + $item.attr('data-slide') + '"]');
    $nav = $('.tournav .item[data-slide="' + $item.attr('data-slide') + '"]');

    $('.tour .slide').hide();
    $slide.show();
    $('.tournav .item').removeClass('active');
    $nav.addClass('active');
};

var vidratio = 1024/576;
var addVideo = function() {
    var w = $('.videoframe').width();
    var h = $('.videoframe').height();
    vidratio = w/h;
    $('#introvideo').html('<iframe src="https://www.youtube.com/embed/wH24YwdayFg?rel=0&autoplay=1&autohide=1&showinfo=0&iv_load_policy=3" width="' + w + '" height="' + h + '" frameborder="0" id="videoframe"></iframe>');
    //$('#introvideo').html('<iframe src="https://www.youtube.com/embed/Jl3-lzlzOJI?autoplay=1" width="' + w + '" height="' + h + '" frameborder="0" id="videoframe"></iframe>');
    $('#introvideo').unbind('click', addVideo);
}
var updateVideoSize = function() {
    $vid = $('#videoframe');
    if ( !$vid.get(0) ) {
        return;
    }
    var w = $(window).width();
    var h = w / vidratio;
    $vid.attr('width', Math.floor(w) );
    $vid.attr('height', Math.floor(h) - 1 );
}

var updateNav = function() {
    if ( animatingScroll ) {
        return;
    }
    //hilight current anchor when you scroll to it
    var anchors = [];
    $('a').each(function(){
        if ( this.name != null && this.name != "" ) {
            //console.log( "#nav_" + this.name );
            if ( $("#nav_" + this.name).get(0) != null ) {
                anchors[anchors.length] = { name:this.name, top: $(this).offset().top};
                //console.log('anchor ' + this.name + ' ' + $(this).offset().top );
            }
        }
    });

    var $this = $(this);
    var y = $this.scrollTop();
    var fudge = 400;

    var active = -1;
    for ( var x=0; x<anchors.length; x++ ){
        if(anchors[x]['top'] < y + fudge){
            active = x;
            //console.log( 'y: ' + y + ' anchor: ' + anchors[x].name + " " + anchors[x].top );
        }
    }
    $('a').removeClass('active');
    if ( active >= 0 ) {
        $('#nav_' + anchors[active]['name']).addClass('active');
    }
};


var update_nav_pos = function() {
    var revealloc = $('.masthead').outerHeight();
    var fixedheight = $('.fixedbar').outerHeight();
    var scrollY = $(window).scrollTop();
    var fadestart = 40;
    var navadjust = 36;
    
    var top = (revealloc - navadjust) - fixedheight - scrollY;
    if ( top < 0 ) {
        top = 0;
    }
    $('.fixedbar').css( {
        'top': top + 'px'
    });

    var revealmin = revealloc - fixedheight - fadestart;
    var revealmax = revealloc - fixedheight;

    var pos =  scrollY;
    if ( pos < revealmin ) {
        pos = revealmin;
    } else if ( pos > revealmax ) {
        pos = revealmax;
    }
    


    revealedfraction = ((pos-revealmin) / (revealmax-revealmin));
    $('.fixedbar .logo').css( {
        'opacity': revealedfraction,
    });

};

var lines = [];
var $canvas;
var ctx;
var buildAnimation = function() {
    lines = [];
    $canvas = $("#animation");
    ctx = $canvas.get(0).getContext("2d");
    var w = $canvas.parent().width();
    var h = $canvas.parent().height();
    $canvas.attr('width', w);
    $canvas.attr('height', h);
    //$canvas.width( w );
    //$canvas.height( h );
    
    for ( var x=0; x<50; x++ ) {

        var tx = (Math.random() * (w+100)) - 50;
        var bx = tx + (Math.random() * 500) - 250;
        var line = { 
            tx: tx,
            bx: bx,
            ty: -20,
            by: h - 200  + (Math.random() * 200),
            opacity: .2,
            direction: Math.random() > .5? 1:-1
        };
        lines.push( line );
    }
    
};
var updateLines  = function() {
    ctx.clearRect(0, 0, $canvas.width(), $canvas.height());
    for ( var x=0; x<lines.length; x++ ) {
        line = lines[x];

        ctx.beginPath();
        ctx.lineWidth = .8;
        ctx.strokeStyle = "rgba(255,255,255," + line.opacity + ")";
        ctx.moveTo( line.tx, line.ty );
        ctx.lineTo( line.bx, line.by );
        ctx.stroke();
        ctx.closePath();

        line.opacity += (Math.random() * .1) - .05;
        if ( line.opacity < 0 ) {
            line.opacity = 0;
        } else if ( line.opacity > 1 ) {
            line.opacity = 1;
        }

        line.bx += (Math.random() * .2) * line.direction;
        if ( line.bx < line.tx - 250 ) {
            line.bx = line.tx - 250;
            line.direction=1;
        } else if ( line.bx > line.tx + 250 ) {
            line.bx = line.tx + 250;
            line.direction = -1;
        }


    }
    requestAnimationFrame( updateLines );
};

//requestAnimationFrame polyfill
//http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
(function() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

