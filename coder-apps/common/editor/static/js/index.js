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

//globals edit_appname appname and appurl should be set in html prior to loading

var csseditor;
var htmleditor;
var jseditor;
var appeditor;
var currenteditor;
var metadata;


$(document).ready( function() {

    $.get( appurl + '/api/metadata/get/' + edit_appname, function( data ) {
        metadata = data.metadata;
        
        if ( metadata.hidden ) {
            $("#settingscontainer .remove_app").hide();
        }
        
        updateUserColor(metadata.color);
        updateMetaData(metadata);
        
        $.get( appurl + '/api/getcode/' + edit_appname, function( data ) {
            csseditor = setupEditor( "csspanel", "csseditor", data.cssdata, "css", "ace/mode/css" ); 
            htmleditor = setupEditor( "htmlpanel", "htmleditor", data.htmldata, "html", "ace/mode/html" ); 
            jseditor = setupEditor( "jspanel", "jseditor", data.jsdata, "js", "ace/mode/javascript" ); 
            appeditor = setupEditor( "apppanel", "appeditor", data.appdata, "app", "ace/mode/javascript" );
            $("#htmlpanel_button").click();
            
            //fold the head tag in the html editor once the page has completed init
            foldHeadTag( htmleditor );
        });
        
    });
    
    //setInterval( function() { resizeAppWindow(); }, 1000/60 );
    //$(window).resize( function(e) { resizeAppWindow() } );

    
    $("#preview_button").click( togglePreview );
    $("#media_button").click( toggleMedia );
    $("#settings_button").click( toggleSettings );

    $("#settingscontainer .colorchit").click( selectColor );
    $("#settingscontainer .save").click( saveMetadata );
    $("#settingscontainer .cancel").click( revertSettings );
    $("#settingscontainer .remove_app").click( removeAppClicked );
    $("#settingscontainer .export_app").click( exportAppClicked );

    $("#settingscontainer input").on('change', checkChangedSettings );
    $("#settingscontainer input").on('keydown', function() { setTimeout( checkChangedSettings, 0); } );

    $("#editornav .application_name").click( function() {
        window.location.href = '/app/' + edit_appname;
    });
    //uncomment to open preview by default
    //togglePreview();
    
    enableMediaUploader();
    updateMediaList();
    
});

var saveMetadata = function() {
    var newmetadata = {};
    for ( i in metadata ) {
        newmetadata[i] = metadata[i];
    }
    newmetadata.name = $('#app_name').val();
    newmetadata.author = $('#app_author').val();
    
    var $selcolor = $("#settingscontainer .colorchit.active").first();
    if ( $selcolor.get(0) ) {
        newmetadata.color = rgb2hex($selcolor.css('background-color'));
    }
    
    $.post( appurl + '/api/savesettings/' + edit_appname,
        {
            metadata: JSON.stringify(newmetadata)
        },
        function( data ) {
            console.log( data );
            metadata = data.metadata;
            updateUserColor(metadata.color);
            updateMetaData(metadata);
            checkChangedSettings();
            if ( edit_appname !== data.appname ) {
                //name changed. reload new url in editor.
                window.location.href = '/app/' + appname + '/edit/' + data.appname;                
            } else {
                //just update the preview
                $("#app").attr( 'src', '/app/' + edit_appname + '?ineditor' );
            }
        }
    );
    
};

var revertSettings = function() {
    updateUserColor(metadata.color);
    updateMetaData(metadata);
    checkChangedSettings();
};

var removeAppClicked = function() {
    var confirmed = confirm( "Permanently delete this app?" );
    console.log( confirmed );
    if ( confirmed ) {
        $.post( '/app/coder/api/app/remove/' + edit_appname, function( d ) {
            console.log( d );
            window.location.href = '/';
        });
    }
};


//http://stackoverflow.com/questions/3749231/download-file-using-javascript-jquery
var downloadURL = function downloadURL(url) {
    var hiddenIFrameID = 'hiddenDownloader',
        iframe = document.getElementById(hiddenIFrameID);
    if (iframe === null) {
        iframe = document.createElement('iframe');
        iframe.id = hiddenIFrameID;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
    }
    iframe.src = url;
};


var exportAppClicked = function() {
    
    $.post( '/app/coder/api/app/export/' + edit_appname, function( d ) {
        if ( d.status == 'success' ) {
            downloadURL( '/app/coder/export/download/' + d.file );
        }
    });
};


var checkChangedSettings = function() {
    var changed = false;
    
    if ( $('#app_author').val() !== metadata.author  ||
        $('#app_name').val() !== metadata.name ) {
        changed = true;
    }
    var $selectedcolor = $("#settingscontainer .colorchit.active").first();
    if ( $selectedcolor.get(0) && rgb2hex($selectedcolor.css('background-color')) !== metadata.color.toLowerCase() ) {
        changed = true;
    }
    
    if ( changed ) {
        $('#settingscontainer').addClass('changed');
    } else {
        $('#settingscontainer').removeClass('changed');
    }
};

var selectColor = function() {
    $this = $(this);
    $("#settingscontainer .colorchit").removeClass('active');
    $this.addClass('active');
    checkChangedSettings();
};

var updateUserColor = function( colorstr ) {
    $('.userbgcolor').css('background-color', colorstr);
    $("#settingscontainer .colorchit").removeClass('active');
    $("#settingscontainer .colorchit").each( function() {
        //console.log( rgb2hex($(this).css('background-color')) );
        if ( rgb2hex($(this).css('background-color')) === colorstr.toLowerCase() ) {
            $(this).addClass('active');
        }
    });
    //hack to append color to the nav item tick's css
    //effectively it does this: $('#editornav .label.active:after').css('border-top-color', colorstr);
    var $style = $("<style>#editornav .label.active:after { border-top-color: " + colorstr + "; }</style>");
    $('html > head').append($style);  
};
var updateMetaData = function( metadata ) {
    $('#date_created .value').text( metadata.created );
    $('#last_edited .value').text( metadata.modified );
    $('#app_author').val( metadata.author );
    $('#app_name').val( metadata.name );
    $("#editornav .application_name").text( metadata.name );
};



var previewon = false;
var togglePreview = function() {
    previewon = !previewon;
    enablePreview( previewon );
};
var enablePreview = function( on ) {
    previewon = on;
    if ( previewon ) {        
        enableMedia( false );
        enableSettings( false );
        if ( edit_appname != "editor" ) {
            $("#app").attr('src', '/app/' + edit_appname + '?ineditor');
        }
        $("body").addClass('previewEnabled');
    } else {
        $("body").removeClass('previewEnabled');
    }
};

var mediaon = false;
var toggleMedia = function() {
    mediaon = !mediaon;
    enableMedia( mediaon );
};
var enableMedia = function( on ) {
    mediaon = on;
    if ( mediaon ) {
        enablePreview( false );
        enableSettings( false );
        $("body").addClass('mediaEnabled');
    } else {
        $("body").removeClass('mediaEnabled');
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
        enablePreview( false );
        enableMedia( false );
        $("body").addClass('settingsEnabled');
    } else {
        $("body").removeClass('settingsEnabled');
    }
};



var resizeAppWindow = function() {
    $("#appcontainer").css({
        height: "100%",
        width: ($("body").width() - $("#editornav").outerWidth()) + "px"
    });
}

var setupEditor = function( panelid, editorid, data, serverid, editmode ) {
    $("#" + editorid).text( data );
    var editor = ace.edit( editorid );
    editor.setTheme("ace/theme/coder");
    editor.getSession().setMode(editmode);
    editor.setBehavioursEnabled( false );
    editor.gotoLine(1); 

    var revert = editor.getValue();
    
    var refreshChangedState = function() {
        if ( editor.getValue() !== revert ) {
            $("#" + panelid + "_button").addClass('changed');
            $("#" + panelid).addClass('changed');
        } else {
            $("#" + panelid).removeClass('changed');
            $("#" + panelid + "_button").removeClass('changed');
        }
    };
    
    editor.on('change', function(e) {
        refreshChangedState();
    });
    
    $('#' + panelid + '_button').click( function() {
            //revert = editor.getValue();
            $("#editornav .label").removeClass('active');
            $(this).addClass('active');
            $('.editpanel').hide();
            $('#' + panelid).show();
            editor.resize();
            currenteditor = editor;
            //$('#editcontainer').removeClass('hclosed').addClass('hopen');
    });
    $('#' + panelid + ' .cancel').click( function() {
            editor.setValue( revert );
            editor.gotoLine(1);
            refreshChangedState();
            editor.focus();

            //$('#' + panelid).hide();
            //$('#' + panelid).removeClass('hopen').addClass('hclosed');
            //$('#editcontainer').removeClass('hopen').addClass('hclosed');
    });
    
    var saveClick = function() {
        if ( editor.getValue() !== revert ) {
            editor.focus();
            var fdata = editor.getValue();
            $.post( appurl + '/api/savecode/' + edit_appname, 
                    {
                        type:serverid,
                        data:fdata,
                        metadata: JSON.stringify(metadata)
                    },
                    function(data) {
                        if ( data.result === "saved" ) {
                            revert = data.data;
                            refreshChangedState();
                            if ( console.clear ) {
                                console.clear();
                            }
                            $("#app").attr('src', '/app/' + edit_appname + '?ineditor');

                        } else {
                            alert( "error: " + data.result );
                            refreshChangedState();
                        }
                    }
            );
            //$('#' + panelid).removeClass('hopen').addClass('hclosed');
            //$('#editcontainer').removeClass('hopen').addClass('hclosed');
            //$('#' + panelid).hide();
        }
    };
    $('#' + panelid + ' .save').click( saveClick );
    
    //support ctrl-s or cmd-s for saving
    editor.commands.addCommand({
        name: 'saveShortcut',
        bindKey: {win: 'Ctrl-S',  mac: 'Command-S'},
        exec: function(editor) {
            saveClick();
        },
        readOnly: false // should not apply in readOnly mode
    }); 
 
    //$('#' + editorid).css('font-size', '16px');
    $('#' + panelid).hide();

    return editor;
};

var foldHeadTag = function( editor ) {
    var sess = editor.getSession();
    
    //hack... 
    //  it takes a while for folding to become available
    //  and there seems to be no event emitted when it's ready
    if ( !sess.getFoldWidgetRange ) {
        setTimeout( function() {
            foldHeadTag( editor );
        }, 10 );
        return;
    }
    
    //try to find head tag in first 10 lines
    for ( var x=0; x<10; x++ ) {
        if ( sess.getLine(x).toLowerCase().indexOf("<head>") >= 0 ) {
            var foldrange = sess.getFoldWidgetRange( x );
            var fold = sess.addFold( '...', foldrange );
            break;
        }
    }
};

var enableMediaUploader = function() {
    $("#mediaUpload").fileupload({
        url: '/app/' + appname + '/api/media/upload',
        formData: {
            appname: edit_appname
        },
        limitMultiFileUploads: 1,
        done: function( e, data ) {
            updateMediaList();
        }
    });
};

var updateMediaList = function() {
    $.get( appurl + '/api/media/list/' + edit_appname, function( data ) {
        $mediaitem_tmpl = $("#media_item_template").clone();
        $mediaitem_tmpl.attr('id',null);
        $("#medialist").children().remove();
        for ( i in data.media ) {
            fileinfo = data.media[i];
            $item = $mediaitem_tmpl.clone();
            $item.attr('data_filename', fileinfo.filename);
            $item.find('.name').text(fileinfo.filename);
            $item.find('.added .date').text(fileinfo.metadata.created);
            $item.find('.copy_button').click( function() {
                var url = '/static/apps/' + edit_appname + '/media/' + $(this).parent().attr('data_filename');
                if ( currenteditor ) {
                    currenteditor.insert( url );
                }
            });
            $item.find('.delete_button').click( function() {
                $.post( '/app/' + appname + '/api/media/remove',
                    {
                        appname: edit_appname,
                        filename: $(this).parent().attr('data_filename')
                    },
                    function(d) {
                        updateMediaList();
                    }
                );
            });
            
            $("#medialist").append( $item );
            $item.show();
        }
    });
};

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



