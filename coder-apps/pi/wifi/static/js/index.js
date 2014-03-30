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

    if ( pagemode === "selectwifi" ) {
        
        $.get( '/app/' + appname + '/api/wifi/list', function(d){
            updateWifiList( d );
            setupWifiSelectFields();
            $('#wifi_form').show();
        });
    }

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

var checkSelectInput = function() {
    $select = $(this).parent().find('select').first();
    $selected = $select.find('option:selected').first();
    //console.log( $selected);
    $('#wifi_form .pass').val("");
    
    if ( $selected.attr('name') === "choose" ) {
        $select.addClass("nochoice");
        $('.formfield.wifipassword').hide();
    } else if ( $selected.attr('name') === "spacer" ) {
        $select.addClass("nochoice");
        $('.formfield.wifipassword').hide();
        $select.find('option[name="choose"]').attr("selected", true);
    }else if ( $selected.attr('name') === "rescan" ) {
        $select.addClass("nochoice");
        $('.formfield.wifipassword').hide();
        $select.hide();
        $.get( '/app/' + appname + '/api/wifi/list', function(d){
            console.log( d );
            updateWifiList( d );
            $select.show();
            $select.find('option[name="choose"]').attr("selected", true);
        });
    } else {
        $select.removeClass("nochoice");
        if ( $selected.attr('data-nettype') === "OPEN" ) {
            $('.formfield.wifipassword').hide();
        } else {
            $('.formfield.wifipassword').show();
        }
    }
    
    testSubmitEnable();
};

var updateWifiList = function( data ) {
    console.log( 'updating wifi list' );
    console.log( data );
    $select = $('.formfield.selectbox select.network');
    $select.find('option').each(function(){
        $this = $(this);
        if ( $this.attr("name") !== "choose" 
                && $this.attr("name") !== "rescan" 
                && $this.attr("name") !== "spacer" ) {
            $this.remove();
        };
    });
    for ( var i in data.networks ) {
        var network = data.networks[i];
        var $op = $("<option />");
        $op.text( network.ssid + " (" + network.type + ")" );
        $op.attr('data-nettype', network.type);
        $op.val( network.ssid );
        $select.append( $op );
    }
};


var testSubmitEnable = function() {
    var $form = $('#wifi_form');
    if ( isValidForm() ) {
        $form.find('.submit').removeClass('disabled');
    } else {
        $form.find('.submit').addClass('disabled');
    }
    
};

var isValidForm = function() {
    var $form = $('#wifi_form');
    var pass = $form.find('.pass').val();
    
    $select = $form.find('select.network').first();
    $selected = $select.find('option:selected').first();
    
    if ( $selected.attr("name") !== "choose" 
            && $selected.attr("name") !== "rescan" 
            && $selected.attr("name") !== "spacer"
            && $selected.val() !== "" 
            && $selected.attr('data-nettype') != "") {
                
        if ( $selected.attr('data-nettype') === "OPEN" 
                || pass !== "" ) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
};

var setupWifiSelectFields = function() {
    $('#wifi_form .formfield.textinput .label').click( focusTextInput );
    $('#wifi_form .formfield.textinput input').click( focusTextInput );
    $('#wifi_form .formfield.textinput input').focus( hideTextLabel );
    $('#wifi_form .formfield.textinput input').blur( onBlurTextInput );
    
    $('#wifi_form .formfield.textinput input').change( testSubmitEnable );
    $('#wifi_form .formfield.textinput input').keydown( function() { 
        setTimeout( testSubmitEnable, 0 );
    });  
      

    $('#wifi_form .formfield.selectbox select option[name="choose"]').attr("selected",true);
    $('#wifi_form .formfield.selectbox select').addClass("nochoice");
    $('.formfield.wifipassword').hide();
    $('#wifi_form .formfield.selectbox select').change( checkSelectInput );


    $('#wifi_form .submit').click( saveClick );
    $('#wifi_form .cancel').click( function() {
        window.location.href="/";
    });
};


var saveClick = function() {
    $this = $(this);
    var $form = $('#wifi_form');

    $form.find('.pass').removeClass('error');
    $form.find('.selectbg').removeClass('error');

    var pass = $form.find('.pass').val();
    var $select = $form.find('select.network').first();
    var $selected = $select.find('option:selected').first();


    if ( !isValidForm() ) {
        if ( $selected.attr("name") === "choose" 
                || $selected.attr("name") === "rescan" 
                || $selected.attr("name") === "spacer"
                || $selected.val() === "" 
                || $selected.attr('data-nettype') === "") {
            console.log('not valid');
            $form.find('.selectbg').addClass('error');
        } else if ( $selected.attr('data-nettype') !== "OPEN" 
                && pass === "" ) {
            $form.find('.pass').addClass('error');
        } else if ( $selected.attr('data-nettype') !== "OPEN" 
		&& $selected.attr('data-nettype') !== "WEP"
		&& pass.length < 8 ) {
            $form.find('.pass').addClass('error');
	}
        return;
    }
    
    $.post(
        appurl + '/api/wifi/configure',
        {
            ssid: $selected.val(),
            type: $selected.attr('data-nettype'),
            password: pass
        },
        function( data ) {
            if ( data.status === "success" ) {
                $('#wifi_form').hide();
                $('#rebooting_form').show();
                $('#rebooting_form .submit').addClass('disabled').text('Your Coder is restarting.');
                $.post(
                    appurl + '/api/reboot',
                    function( data ) {
                        //TODO: we should be doing some kind of polling here to determine if we can connect to coder
                        setTimeout( function() {
                            $('#rebooting_form .submit').removeClass('disabled').text('Reconnect to coder.local');
                            $('#rebooting_form .submit').click( function() {
                                window.location.href="https://coder.local/";
                            });
                        }, 60 * 1000 );
                    }
                );
            }
        }
    );
    
/*    
    $.post( 
        appurl + '/api/login', 
        {
            password: $this.parent().find('.pass').val() 
        }, 
        function( data ) {
            console.log( data );
            if( data.status === "success" ) {
                window.location.href="/app/coder";
            } else {
                
                $form.find('.pass').addClass('error');
            }
        }
    );
    */
};





