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

$(document).ready( function() {

    if ( pagemode === "logout" ) {
        setupLogoutFields();
        $('#logout_form').show();
    } else if ( pagemode === "login" ) {
        setupLoginFields();
        $('#login_form').show();
    } else if ( pagemode === "configure" ) {
        setupConfigureFields();
        $('#configure_form').show();
    } else if ( pagemode === "addpassword" ) {
        setupAddPasswordFields();
        $('#addpassword_form').show();
    } else if ( pagemode === "changepassword" ) {
        setupChangePasswordFields();
        $('#changepassword_form').show();
    } else {
        setupLoginFields();
        $('#login_form').show();
    }

    buildAnimation();
    updateAnimation();
    $(window).on('resize', function() {
        setTimeout( buildAnimation, 1 );
    });
});

var hideTextLabel = function() {
    $(this).parent().find('.label').hide();
};
var focusTextInput = function() {
    $(this).parent().find('input').focus();
};
var onBlurTextInput = function() {
    if ( $(this).val() == "" ) {
        $(this).parent().find('.label').show();
    }
};
var testLoginSubmitEnable = function() {
    var $form = $('#login_form');
    if ( pagemode === "logout" ) {
        $form = $('#logout_form');
    }
    
    
    if ( $form.find('.pass').val() && $form.find('.pass').val() != "" ) {
        $form.find('.submit').removeClass('disabled');
    } else {
        $form.find('.submit').addClass('disabled');
    }
};

var testConfigureSubmitEnable = function() {
    var $form = $('#configure_form');
    var devicename = $form.find('.device_name').val();
    if ( devicename && devicename != "" && 
            isValidDeviceName(devicename) ) {
        $form.find('.submit').removeClass('disabled');
    } else {
        $form.find('.submit').addClass('disabled');
    }
};

var testAddPasswordSubmitEnable = function() {
    var $form = $('#addpassword_form');
    var pass = $form.find('.pass').val();
    var pass_repeat = $form.find('.pass_repeat').val();
    $form.find('.pass, .pass_repeat').removeClass('error');
    $form.find('.errormessage').css('visibility','hidden');
    
    if ( isValidPassword(pass) && pass === pass_repeat ) {
        $form.find('.submit').removeClass('disabled');    
    } else {
        $form.find('.submit').addClass('disabled');
    }
};

var testChangePasswordSubmitEnable = function() {
    var $form = $('#changepassword_form');
    var oldpass = $form.find('.oldpass').val();
    var pass = $form.find('.pass').val();
    var pass_repeat = $form.find('.pass_repeat').val();
    $form.find('.errormessage').css('visibility','hidden');
    $form.find('.oldpass, .pass, .pass_repeat').removeClass('error');
    if ( oldpass !== "" && isValidPassword(pass) && pass === pass_repeat ) {
        $form.find('.submit').removeClass('disabled');
    } else {
        $form.find('.submit').addClass('disabled');
    }
};


var setupLoginFields = function() {
    $('#login_form .formfield.textinput .label').click( focusTextInput );
    $('#login_form .formfield.textinput input').click( focusTextInput );
    $('#login_form .formfield.textinput input').focus( hideTextLabel );
    $('#login_form .formfield.textinput input').blur( onBlurTextInput );
    $('#login_form .formfield.textinput input').change( testLoginSubmitEnable );
    $('#login_form .formfield.textinput input').keydown( function(e) { 
        if (e.which != 13) {
            setTimeout( testLoginSubmitEnable, 0 );
        }
    });

    //submit on enter or button click
    $('#login_form .formfield.textinput .pass').keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
            loginClick( $('#login_form .formfield.textinput .pass') );
        }
    });
    $('#login_form .submit').click( function() {
        loginClick( $('#login_form .formfield.textinput .pass') );
    });
};
var setupLogoutFields = function() {
    $('#logout_form .formfield.textinput .label').click( focusTextInput );
    $('#logout_form .formfield.textinput input').click( focusTextInput );
    $('#logout_form .formfield.textinput input').focus( hideTextLabel );
    $('#logout_form .formfield.textinput input').blur( onBlurTextInput );
    $('#logout_form .formfield.textinput input').change( testLoginSubmitEnable );
    $('#logout_form .formfield.textinput input').keydown( function(e) { 
        if (e.which != 13) {
            setTimeout( testLoginSubmitEnable, 0 );
        }
    });  

    //submit on enter or button click
    $('#logout_form .formfield.textinput .pass').keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
            loginClick( $('#logout_form .formfield.textinput .pass') );
        }
    });
    $('#logout_form .submit').click( function() {
        loginClick( $('#logout_form .formfield.textinput .pass') );
    });
};
var setupConfigureFields = function() {
    $('#configure_form .formfield.textinput .label').click( focusTextInput );
    $('#configure_form .formfield.textinput input').click( focusTextInput );
    $('#configure_form .formfield.textinput input').focus( hideTextLabel );
    $('#configure_form .formfield.textinput input').blur( onBlurTextInput );
    $('#configure_form .formfield.textinput input').change( testConfigureSubmitEnable );
    $('#configure_form .formfield.textinput input').keydown( function(e) { 
        if (e.which != 13) {
            setTimeout( testConfigureSubmitEnable, 0 );
        }
    });  
    $('#configure_form .submit').click( configureClick );
    $('#configure_form .device_name').val( 'My Coder' ).parent().find('.label').hide();
    testConfigureSubmitEnable();
};
var setupAddPasswordFields = function() {
    $('#addpassword_form .formfield.textinput .label').click( focusTextInput );
    $('#addpassword_form .formfield.textinput input').click( focusTextInput );
    $('#addpassword_form .formfield.textinput input').focus( hideTextLabel );
    $('#addpassword_form .formfield.textinput input').blur( onBlurTextInput );
    $('#addpassword_form .formfield.textinput input').change( testAddPasswordSubmitEnable );
    $('#addpassword_form .formfield.textinput input').keydown( function(e) { 
        if (e.which != 13) {
            setTimeout( testAddPasswordSubmitEnable, 0 );
        }
    });

    $('#addpassword_form .formfield.textinput .pass_repeat').keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
            addPasswordClick();
        }
    });

    $('#addpassword_form .submit').click( addPasswordClick );
};

var setupChangePasswordFields = function() {
    $('#changepassword_form .formfield.textinput .label').click( focusTextInput );
    $('#changepassword_form .formfield.textinput input').click( focusTextInput );
    $('#changepassword_form .formfield.textinput input').focus( hideTextLabel );
    $('#changepassword_form .formfield.textinput input').blur( onBlurTextInput );
    $('#changepassword_form .formfield.textinput input').change( testChangePasswordSubmitEnable );
    $('#changepassword_form .formfield.textinput input').keydown( function(e) { 
        if (e.which != 13) {
            setTimeout( testChangePasswordSubmitEnable, 0 );
        }
    });        

    $('#changepassword_form .formfield.textinput .pass_repeat').keypress(function (e) {
        if (e.which == 13) {
            e.preventDefault();
            changePasswordClick();
        }
    });
    
    $('#changepassword_form .submit').click( changePasswordClick );
    $('#changepassword_form .cancel').click( function() {
        window.location.href="/";
    });
};

var loginClick = function( what ) {
    $this = $(what);
    var $form = $('#login_form');
    if ( pagemode === "logout" ) {
        $form = $('#logout_form');
    }
    
    $form.find('.errormessage').css('visibility','hidden');
    $form.find('.pass').removeClass('error');
    $.post( 
        appurl + '/api/login', 
        {
            password: $this.parent().find('.pass').val() 
        }, 
        function( data ) {
            console.log( data );
            if( data.status === "success" ) {
		var firstuse = "";
                if ( typeof getParams['firstuse'] !== 'undefined' ) {
                    firstuse = '?firstuse';
                }
                window.location.href="/app/coder" + firstuse;
            } else {
                $form.find('.errormessage').text( data.error ).css('visibility','visible');
                $form.find('.pass').addClass('error');
            }
        }
    );
};

var configureClick = function() {
    $this = $(this);
    var $form = $('#configure_form');

    $form.find('.device_name').removeClass('error');
    var devicename = $this.parent().find('.device_name').val();
    
    if ( !isValidDeviceName(devicename) ) {
        $form.find('.device_name').addClass('error');
        return;
    }
    
    $.post( 
        appurl + '/api/devicename/set', 
        {
            device_name: devicename 
        }, 
        function( data ) {
            console.log( data );
            if( data.status === "success" ) {
                window.location.href="/app/auth";
            } else {
                $form.find('.device_name').addClass('error');
            }
        }
    );
};

var addPasswordClick = function() {
    var $form = $('#addpassword_form');

    $form.find('.pass, .pass_repeat').removeClass('error');
    $form.find('.errormessage').css('visibility','hidden');
    var pass = $form.find('.pass').val();
    var pass_repeat = $form.find('.pass_repeat').val();
    
    if ( !isValidPassword(pass) ) {
        $form.find('.pass').addClass('error');
        $form.find('.errormessage').text( getPasswordProblem(pass) ).css('visibility','visible');
        return;
    }
    if ( pass !== pass_repeat ) {
        $form.find('.pass_repeat').addClass('error');
        $form.find('.errormessage').text( "new password does not match" ).css('visibility','visible');
        return;
    }
    
    $.post( 
        appurl + '/api/addpassword', 
        {
            password: pass 
        }, 
        function( data ) {
            console.log( data );
            if( data.status === "success" ) {
                var firstuse = '';
                if ( typeof getParams['firstuse'] !== 'undefined' ) {
                    firstuse = '?firstuse';
                }
                window.location.href="/app/auth" + firstuse;
            } else {
                $form.find('.pass').addClass('error');
                $form.find('.errormessage').text( data.error ).css('visibility','visible');
            }
        }
    );
};


var changePasswordClick = function() {
    
    var $form = $('#changepassword_form');

    $form.find('.oldpass, .pass, .pass_repeat').removeClass('error');
    $form.find('.errormessage').css('visibility','hidden');
    var oldpass = $form.find('.oldpass').val();
    var pass = $form.find('.pass').val();
    var pass_repeat = $form.find('.pass_repeat').val();
    
    if ( oldpass === "" ) {
        $form.find('.oldpass').addClass('error');
        $form.find('.errormessage').text( "your current password is required" ).css('visibility','visible');
        return;
    }
    if ( !isValidPassword(pass) ) {
        $form.find('.pass').addClass('error');
        $form.find('.errormessage').text( getPasswordProblem(pass) ).css('visibility','visible');
        return;
    }
    if ( pass !== pass_repeat ) {
        $form.find('.pass_repeat').addClass('error');
        $form.find('.errormessage').text( "new password does not match" ).css('visibility','visible');
        return;
    }
    
    $.post( 
        appurl + '/api/changepassword', 
        {
            oldpassword: oldpass,
            password: pass 
        }, 
        function( data ) {
            console.log( data );
            if( data.status === "success" ) {
                window.location.href="/app/auth";
            } else {
                $form.find('.oldpass').addClass('error');
                $form.find('.errormessage').text( data.error ).css('visibility','visible');
            }
        }
    );
};

var isValidDeviceName = function( name ) {
    if ( !name || name === '' ) {
        return false;
    }
    //starts with an ascii word char. can contain word char's spaces and '
    if ( !name.match(/^[a-zA-Z0-9][\w ']*$/) ) {
        return false;
    }
    //ends in an ascii word char
    if ( !name.match(/[a-zA-Z0-9]$/) ) {
        return false;
    }
    return true;
};

var getPasswordProblem = function( pass ) {
    if ( !pass || pass === '' ) {
        return "the password is empty";
    }
    if ( pass.length < 6 ) {
        return "the password should contain at least 6 characters";
    }
    if ( !pass.match(/[a-z]/) || 
        !pass.match(/[A-Z0-9\-\_\.\,\;\:\'\"\[\]\{\}\!\@\#\$\%\^\&\*\(\)\\].*[A-Z0-9\-\_\.\,\;\:\'\"\[\]\{\}\!\@\#\$\%\^\&\*\(\)\\]/) ) {
        return "your password must contain a lower case letter and at least two upper case letters or numbers";
    }
};
var isValidPassword = function( pass ) {
    if ( !pass || pass === '' ) {
        return false;
    }
    //at least 6 characters
    if ( pass.length < 6 ) {
        return false;
    }
    //contains lower case
    if ( !pass.match(/[a-z]/) ) {
        return false;
    }
    //contains two upper case or numbers
    if ( !pass.match(/[A-Z0-9\-\_\.\,\;\:\'\"\[\]\{\}\!\@\#\$\%\^\&\*\(\)\\].*[A-Z0-9\-\_\.\,\;\:\'\"\[\]\{\}\!\@\#\$\%\^\&\*\(\)\\]/) ) {
        return false;
    }
    return true;
};

var circles = [];
var $canvas;
var ctx;
var buildAnimation = function() {
    circles = [];
    $canvas = $("#animation");
    ctx = $canvas.get(0).getContext("2d");
    var w = $canvas.parent().width();
    var h = $canvas.parent().height();
    $canvas.attr('width', w);
    $canvas.attr('height', h);
    
    for ( var x=0; x<20; x++ ) {
        var sx = (Math.random() * (w+100)) - 50;
        var sy = (Math.random() * 800) - 400;
        var circle = { 
            sx: sx,
            sy: sy,
            x: sx,
            y: sy,
            r: (Math.random() * 150) + 30,
            opacity: .2,
            direction: Math.random() > .5? 1:-1
        };
        circles.push( circle );
    }
};

var updateAnimation = function() {
    ctx.clearRect(0, 0, $canvas.width(), $canvas.height());
    for ( var x=0; x<circles.length; x++ ) {
        circle = circles[x];
    
        ctx.beginPath();
        ctx.lineWidth = .8;
        ctx.strokeStyle = "rgba(255,255,255," + circle.opacity + ")";
        ctx.arc( circle.x, circle.y, circle.r, 0, Math.PI *2, true );
        ctx.stroke();
        ctx.closePath();
    
        circle.opacity += (Math.random() * .1) - .05;
        if ( circle.opacity < .1 ) {
            circle.opacity = .1;
        } else if ( circle.opacity > .9 ) {
            circle.opacity = .9;
        }

        circle.x += (Math.random() * .2) * circle.direction;
        if ( circle.x < circle.sx - 250 ) {
            circle.x = circle.sx - 250;
            circle.direction=1;
        } else if ( circle.x > circle.sx + 250 ) {
            circle.x = circle.sx + 250;
            circle.direction = -1;
        }
    
    
    }
    setTimeout( updateAnimation, 1000/60 );
};



