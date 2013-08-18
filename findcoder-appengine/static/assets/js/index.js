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
    refreshList();
    $("#fallback .device").click( function() {
        window.location.href = $(this).attr('data-url');
    });
    $('.refresh').click( function() {
        refreshList();
    });
});

var refreshList = function() {
    $.get('/api/coder/list', function(data) {
        clearList();
        for ( i in data.devices ) {
            var d = data.devices[i];
            addToList( d.name, d.ip, d.net );
        }
    });
};

var addToList = function( name, ip, net ) {
    $item = $('#coderitem_template').clone();
    $item.attr('id','');
    $item.find('.name').text( name );
    $item.attr('data-url', 'http://' + ip + '/' );
    $item.attr('data-net', net );
    $("#coder_list").append($item);
    $item.show();
    $item.click( function() {
        $this = $(this);
        window.location.href = $this.attr('data-url');
    });
};

var clearList = function() {
    $("#coder_list .device").remove();
};

