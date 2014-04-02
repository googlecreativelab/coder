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

var metadata;

$(document).ready( function() {

    Coder.listApps( buildAppList );   
    
    $('#addapp_button').click( function(e){
        $(this).hide();
        $("#createform").show();
    });
    $('#createform .cancel').click( function(e){
        $("#createform").hide();
        $("#addapp_button").show();
    });
    $('#createform .submit').click( createAppClicked );

    $('#import_file').on('change', handleFileImport );

    $('#createform .formfield.textinput .label').click( focusTextInput );
    $('#createform .formfield.textinput input').click( focusTextInput );
    $('#createform .formfield.textinput input').focus( hideTextLabel );
    $('#createform .formfield.textinput input').blur( onBlurTextInput );
    
    $("#createform .colorchit").click( selectAppColor );
    activateCurrentColor();


    $("#settings_button").click( toggleSettings );
    $("#settingscontainer .changepass").click( function() {
        window.location.href="/app/auth/changepassword";
    });

    $("#settingscontainer .colorchit").click( selectCoderColor );
    activateCurrentCoderColor();
    updateSettingsData();
    $("#settingscontainer input").on('change', checkChangedSettings );
    $("#settingscontainer input").on('keydown', function() { setTimeout( checkChangedSettings, 0); } );
    $("#settingscontainer .cancel").click( revertSettings );
    $("#settingscontainer .save").click( saveSettings );
    
    $("#settingscontainer .logout").click( function() {
        window.location.href="/app/auth/logout";
    });
    
    if ( typeof getParams['firstuse'] !== 'undefined' ) {
        setTimeout( function(){
            buildIntroduction();
        }, 400 );
    } else {
        $('#introduction').css('display','none');
    }
});


var buildIntroduction = function() {
    $('#introduction').css({
        'display': 'none',
        'visibility': 'visible'
    }).fadeIn( 'slow', function() {
        setTimeout( function() {
            $('#myapps_tip').css({'visibility':'visible'}).hide().fadeIn();
        }, 1000);
        setTimeout( function() {
            $('#newapp_tip').css({'visibility':'visible'}).hide().fadeIn();
        }, 2000);
        setTimeout( function() {
            $('#settings_tip').css({'visibility':'visible'}).hide().fadeIn();
        }, 3000);
    });
    $('.gotit').click( function() {
        $('#introduction').fadeOut(function() {
            $(this).hide();
        });
    });
};





var revertSettings = function() {
    activateCurrentCoderColor();
    updateSettingsData();
    checkChangedSettings();
};

var updateSettingsData = function( ) {
    $('#coder_name').val( device_name );
    $('#coder_ownername').val( coder_owner );
};

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
var thefile = null;
var handleFileImport = function( ev ) {
    var files = ev.target.files;

    if ( files && files.length > 0 ) {
        var importfile = files[0];

        //console.log( importfile );
        if (!importfile.type.match('application/zip') && !importfile.name.match(/\.zip$/i)) {
            alert('This doesn\'t appear to be a Coder project zip file');
            return false;
        }
        thefile = importfile;
        
        var fdata = new FormData();
        fdata.append( 'import_file', thefile );
        fdata.append( 'test', 'foo' );
        
        $.ajax({
            url: '/app/coder/api/app/import',
            type: 'POST',
            contentType: false,
            processData: false,
            cache: false,
            data: fdata,
            success: function( data ) {
                //console.log('upload returned');
                //console.log(data);
                if ( data.status === 'success' ) {
                    var newappid = data.appname;
                    window.location.href = '/app/editor/edit/' + encodeURIComponent(newappid);
                } else if ( typeof data.error !== 'undefined' ) {
                    alert( data.error );
                }
            }
        });
        
        
        /*
        var reader = new FileReader();
        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                // Render thumbnail.
                var span = document.createElement('span');
                span.innerHTML = ['<img class="thumb" src="', e.target.result,
                            '" title="', escape(theFile.name), '"/>'].join('');
                document.getElementById('list').insertBefore(span, null);
            };
        })(f);
      
        reader.readAsDataURL(f);
        */
    }
};


var settingson = false;
var toggleSettings = function() {
    settingson = !settingson;
    enableSettings( settingson );
};
var enableSettings = function( on ) {
    settingson = on;
    if ( settingson ) {
        $("body").addClass('settingsEnabled');
    } else {
        $("body").removeClass('settingsEnabled');
    }
};


var activateCurrentCoderColor = function() {
    var current = coder_color;
    $("#coder_nav").css('background-color', current);
    $("#settingscontainer .colorchit").each( function() {
        $this = $(this);
        $this.removeClass('active');
    
        if ( rgb2hex($this.css('background-color')) === current ) {
            $this.addClass('active');
        }
    });
    
};

var selectCoderColor = function() {
    $this = $(this);
    $("#settingscontainer .colorchit").removeClass('active');
    $this.addClass('active');
    checkChangedSettings();
};

var device_changed = false;
var owner_changed = false;
var color_changed = false;
var checkChangedSettings = function() {
    var changed = false;
    device_changed = false;
    owner_changed = false;
    color_changed = false;
    
    if ( $('#coder_name').val() !== device_name ) {
        changed = device_changed = true;
    }
    if ( $('#coder_ownername').val() !== coder_owner ) {
        changed = owner_changed = true;
    }
    var $selectedcolor = $("#settingscontainer .colorchit.active").first();
    if ( $selectedcolor.get(0) && rgb2hex($selectedcolor.css('background-color')) !== coder_color.toLowerCase() ) {
        changed = color_changed = true;
    }
    
    if ( changed ) {
        $('#settingscontainer').addClass('changed');
    } else {
        $('#settingscontainer').removeClass('changed');
    }
};

var saveSettings = function() {

    var saveDeviceName = function(callback) {
        if ( !device_changed ) {
            callback();
            return;
        }
        $.post('/app/auth/api/devicename/set',
            { 'device_name': $('#coder_name').val() },
            function(d) {
                //console.log( d );
                if ( d.status === 'success' ) {
                    device_name = d.device_name;
                    $("#coder_logo").text( device_name );
                }
                callback();
            }
        );
    };

    var saveOwnerName = function(callback) {
        if ( !owner_changed ) {
            callback();
            return;
        }
        $.post('/app/auth/api/coderowner/set',
            { 'coder_owner': $('#coder_ownername').val() },
            function(d) {
                //console.log( d );
                if ( d.status === 'success' ) {
                    coder_owner = d.coder_owner;
                }
                callback();
            }
        );
    };

    var saveCoderColor = function(callback) {
        if ( !color_changed ) {
            callback();
            return;
        }
        var $selectedcolor = $("#settingscontainer .colorchit.active").first();
        if ( !$selectedcolor.get(0) ) {
            callback();
            return;
        }
        var hexcolor = rgb2hex($selectedcolor.css('background-color'));
        
        
        $.post('/app/auth/api/codercolor/set',
            { 'coder_color': hexcolor },
            function(d) {
                //console.log( d );
                if ( d.status === 'success' ) {
                    coder_color = d.coder_color;
                    $("#coder_nav").css('background-color', coder_color);
                }
                callback();
            }
        );
    };

    saveDeviceName(function() {
        saveOwnerName(function() {
            saveCoderColor(function() {
                checkChangedSettings();
            });
        });
    });

};

var buildAppList = function(apps){
    
    
    //get the app color from our own app (appname is set globally in template)
    metadata = apps[appname].metadata;
    $('.userbgcolor').css('background-color', metadata.color);

    var $apptmpl = $('#appitem_template').clone();
    $apptmpl.attr('id', '').css('display','');

    var launchApp = function( appname ) {
        return function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/app/' + encodeURIComponent(appname);
        };
    };
    var editApp = function( appname ) {
        return function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '/app/editor/edit/' + encodeURIComponent(appname);
        };
    };



    //Sort the apps by more recently modified
    var sortedapps = [];
    for ( var k in apps ) {
        sortedapps.push( apps[k] );
    }
    sortedapps.sort( function(a,b) {
        if ( a.ctime < b.ctime ) {
            return 1;
        } else if ( b.ctime < a.ctime ) {
            return -1;
        } else {
            return 0;
        }
    });

    for ( var x=0; x<sortedapps.length; x++ ) {
        var app = sortedapps[x];
        
        //don't show hidden apps
        //console.log( app.metadata );
        if ( app.metadata.hidden ) {
            continue;
        }
        
        var $a = $apptmpl.clone();
        $a.find('.appname').text( app.appname );
        if ( app.metadata.name && app.metadata.name !== "" ) {
            $a.find('.appname').text( app.metadata.name );
        }
        $a.css('background-color', app.metadata.color);
        
        $a.hover(
            function() {
                $(this).find('.editbutton').show();
            },
            function() {
                $(this).find('.editbutton').hide();
            }
        );

        $a.click( launchApp( app.appname ) );
        $a.find('.editbutton').click( editApp( app.appname ) );
        
        $('#applist').append( $a );
        
    }
};

var activateCurrentColor = function() {
    var current = $("#additem").css('background-color');
    $("#createform .colorchit").each( function() {
        $this = $(this);
        $this.removeClass('active');
    
        if ( $this.css('background-color') === current ) {
            $this.addClass('active');
        }
    });
    $("#createform .newapp_textcolor").css( 'color', current );
};

var selectAppColor = function() {
    $this = $(this);
    $("#createform .colorchit").removeClass('active');
    $this.addClass('active');
    
    var color = $this.css('background-color');
    $("#additem, #additem .appbgcolor").css('background-color', color);
    $("#createform .newapp_textcolor").css( 'color', color );
};

var createAppClicked = function() {
    $("#createform .newapp_name").removeClass('error');

    if ( validCreateForm() ) {
        $("#createform").hide();
        $.post(
            '/app/' + appname + '/api/app/create',
            {
                app_title: $("#createform .newapp_name").val(),
                app_color: rgb2hex( $("#createform .colorchit.active").first().css('background-color') )
            },
            function(d) {
                //console.log( d );
                var newappid = d.appname;
                window.location.href = '/app/editor/edit/' + encodeURIComponent(newappid);
            }
        );
    } else if ( $("#createform .newapp_name").val() === "" ) {
        $("#createform .newapp_name").addClass('error');
    }
};

var validCreateForm = function() {
    if ( $("#createform .newapp_name").val() !== "" &&
            $("#createform .colorchit.active").first().get(0) ){
        return true;
    }
    return false;
};

// http://stackoverflow.com/questions/1740700/get-hex-value-rather-than-rgb-value-using-jquery
function rgb2hex(rgb) {
    rgbmatch = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if ( !rgbmatch ) {
        return rgb;
    }
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgbmatch[1]) + hex(rgbmatch[2]) + hex(rgbmatch[3]);
}
