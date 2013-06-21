
var red = 0;
var green = 0;
var blue = 0;
var colorchange = false;
var lasthex="#000000";

var sliderRanges = {
    top: 32, 
    bottom: 212,
    topval: 255,
    bottomval: 0
};





$(document).ready( function() {

    addVertSliderControl( '#redcontrol', sliderRanges, onRedChange );
    addVertSliderControl( '#greencontrol', sliderRanges, onGreenChange );
    addVertSliderControl( '#bluecontrol', sliderRanges, onBlueChange );



    var checkColorChange = function() {
            
        if ( colorchange == true ) {
            colorchange = false;
            var rgb = "#" + intToHex(red) + intToHex(green) + intToHex(blue);
            //console.log(rgb);
            updateScreenColors();
            setTimeout( checkColorChange, 10 );
        } else {
            setTimeout( checkColorChange, 10 );
        }
    };
    setTimeout( checkColorChange, 10 );


    var updateColorText = function() {
                
        var rval = parseInt(rgbCSSToInts( $("#redcontrol .slider").css('background-color') ).r);
        var gval = parseInt(rgbCSSToInts( $("#greencontrol .slider").css('background-color') ).g);
        var bval = parseInt(rgbCSSToInts( $("#bluecontrol .slider").css('background-color') ).b);
        
        $("#redcontrol .label").text( intToHex(rval) );
        $("#greencontrol .label").text( intToHex(gval) );
        $("#bluecontrol .label").text( intToHex(bval) );
        $("#compositecolor .label .redtxt").text( intToHex(rval) );
        $("#compositecolor .label .greentxt").text( intToHex(gval) );
        $("#compositecolor .label .bluetxt").text( intToHex(bval) );
        setTimeout( updateColorText, 10 );
    };
    updateColorText();    

    updateScreenColorsFromHex("#000000");
    setTimeout( function() {
        updateScreenColorsFromHex("#ffffff");
        setTimeout( function() {
            updateScreenColorsFromHex("#000000");
            setTimeout( function() {
                updateScreenColorsFromHex("#ff0000");
                setTimeout( function() {
                    updateScreenColorsFromHex("#00ff00");
                    setTimeout( function() {
                        updateScreenColorsFromHex("#0000ff");
                        setTimeout( function() {
                            updateScreenColorsFromHex("#50ffff");
                            setTimeout( function() {
                                updateScreenColorsFromHex("#ff9950");
                            }, 400 );
                        }, 400 );
                    }, 400 );
                }, 400 );
            }, 800 );
        }, 400 );
    }, 400 );

    
});


var rgbCSSToInts = function( rgbstring ) {
    
    failedval = {r:0,g:0,b:0};
    
    if ( typeof rgbstring === 'undefined' ) {
        return failedval;
    }
    
    var rgbreg = rgbstring.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if ( rgbreg ) {
        return {
            r: rgbreg[1], 
            g: rgbreg[2],
            b: rgbreg[3]
        };
    }
    return failedval;
};

var updateScreenColors = function() {
    $("#redcontrol .slider").css('background-color', '#' + intToHex(red) + "0000");
    $("#greencontrol .slider").css('background-color', '#' + "00" + intToHex(green) + "00");
    $("#bluecontrol .slider").css('background-color', '#' + "0000" + intToHex(blue) );
    
    var rgb = '#' + intToHex(red) + intToHex(green) + intToHex(blue);
    $("#compositecolor .swatch").css('background-color', rgb );

    adjustSliderPositions();
};

var updateScreenColorsFromHex = function( hexcode ) {
    var rgb = parseInt(hexcode.replace("#",""), 16);
    console.log( rgb + " " + hexcode + " last " + lasthex);
    b = rgb % 256;
    rgb = Math.floor( rgb/256 );
    g = rgb % 256;
    rgb = Math.floor( rgb/256 );
    r = rgb % 256;
    
    red=r;
    green=g;
    blue=b;
    colorchange = true;
    lasthex = hexcode;
};

var intToHex = function( val ) {
    var result = val.toString(16);
    if ( typeof result === 'undefined' ) {
        result = "00";
    }
    while ( result.length < 2 ) {
        result = "0" + result;
    }
    return result.toUpperCase();
};

var onRedChange = function( val ) {
    //console.log( "red: " + val );
    red = val;
    colorchange = true;
};
var onGreenChange = function( val ) {
    //console.log( "green: " + val );
    green = val;
    colorchange = true;
};
var onBlueChange = function( val ) {
    //console.log( "blue: " + val );
    blue = val;
    colorchange = true;
};

var adjustSliderPositions = function() {
    
    var adjustPosition = function( dompath, val, ranges ) {
        var $control = $(dompath);
        var $slider = $(dompath + " .slider");
        var ranges = ranges;
                
        var pct = (val-ranges['bottomval']) / (ranges['topval'] - ranges['bottomval']);
        var top = ( (1-pct) * (  ranges['bottom']-ranges['top'] )) + ranges['top'];
        //console.log( (1-pct) + " " + (ranges['bottom']-ranges['top']) + " " + ranges['top'] + " " +  top);
        
        $slider.css('top', Math.round(top) + "px");

    };

    adjustPosition("#redcontrol", red, sliderRanges);
    adjustPosition("#greencontrol", green, sliderRanges);
    adjustPosition("#bluecontrol", blue, sliderRanges);

};

var addVertSliderControl = function( dompath, ranges, callback ) {

    var $control = $(dompath);
    var $slider = $(dompath + " .slider");
    var ranges = ranges;
    var callback = callback;
    $slider.bind('mousedown', function(ev){
        ev.preventDefault();
        var basey = $control.offset().top;
        var starty = ev.pageY;
        var lasty = ev.pageY;
        var slider_starty = $slider.offset().top;
        var slider_lasty = $slider.offset().top;


        $('.slider').removeClass('animation-slide');

        var uphandler = function(ev) {
            $(window).unbind('mouseup', uphandler);
            $(window).unbind('mousemove', movehandler);
            $('.slider').addClass('animation-slide');
        };
        var movehandler = function(ev) {
            ev.preventDefault();
            lasty = ev.pageY;
            slider_lasty = slider_starty + (lasty-starty) - basey;
            if ( slider_lasty < ranges['top'] ) {
                slider_lasty = ranges['top'];
            } else if ( slider_lasty > ranges['bottom'] ) {
                slider_lasty = ranges['bottom'];
            }
            $slider.css('top',slider_lasty + "px");
            
            var pct = 1 - ((slider_lasty-ranges['top']) / ( ranges['bottom']-ranges['top'] ));
            var amt = (pct * (ranges['topval'] - ranges['bottomval'])) + ranges['bottomval'];
            //console.log( pct + " " + amt );
            callback( Math.round( amt ) );
        };
        
        $(window).bind('mouseup', uphandler );
        $(window).bind('mousemove', movehandler );

    });
    
    
};





