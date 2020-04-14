/*jshint esversion: 6 */
document.write("<style>img{width: 100%; transition: opacity .2s,-webkit-filter .2s;opacity: 0}img[src]:hover{-webkit-filter: brightness(70%);}.img-container {position: relative;}.tag {position: absolute;right: 0px;bottom: 0px;z-index: 1000;background: rgba(0,0,0,0.35);border-top-left-radius: 4px;padding: 5px;color: #FFFFFF;}p{overflow: hidden;text-overflow: ellipsis;display: -webkit-box;-webkit-box-orient: vertical;-webkit-line-clamp: 2;line-height: 1.5em;height: 3em;margin-top: 8px}a{text-decoration: none;color: white}.img-container{width: 100%;transition: opacity .3s;background-image: url(https://cdn.jsdelivr.net/gh/jazz511/goindex@red/assets/thumb640x360-min.png);background-size: cover;}img.initial,img.loaded,img.error {opacity: 1;}/* PLYR */.plyr--full-ui input[type=range]{color: #ff5252!important;}.plyr__control--overlaid {background: rgba(255,82,82,.8);}.plyr--video .plyr__control.plyr__tab-focus, .plyr--video .plyr__control:hover, .plyr--video .plyr__control[aria-expanded=true], .plyr__menu__container .plyr__control[role=menuitemradio][aria-checked=true]::before, .plyr__control--overlaid:focus, .plyr__control--overlaid:hover {background: #ff5252!important;}@media screen and (max-width: 633px){#player {margin-top: 0 !important;}.video{margin-top: 0 !important;}}.video{margin-top: 16px;}.plyr__control.plyr__tab-focus {box-shadow: 0 0 0 5px rgba(225,82,82,.5);}</style>");

// initialize the page and load the necessary resources
mdui.mutation();

function imgResize() {
    var width = $("img").width();
    $("img").height(width * 0.5625);
}

$(window).on("resize orientationchange", imgResize);

var lazyLoadInstance = new LazyLoad({
    threshold: 0,
    elements_selector: ".lazy"
});

function init() {
    document.siteName = $('title').html();
    $('body').addClass("mdui-theme-layout-dark mdui-theme-primary-red mdui-theme-accent-red");
    var html = `
<header class="mdui-appbar"> 
   <div id="nav" class="mdui-toolbar mdui-container"> 
   </div> 
</header>
<div id="content" class="mdui-container"> 
</div>
	`;
    $('body').html(html);
    //lazyLoadInstance.update();
}

function render(path) {
    if (path.indexOf("?") > 0) {
        path = path.substr(0, path.indexOf("?"));
    }
    title(path);
    nav(path);
    if (path.substr(-1) == '/') {
        list(path);
    } else {
        file(path);
    }
}


// 渲染 title
function title(path) {
    path = decodeURI(path);
    $('title').html(document.siteName + ' - ' + path);
}

// 渲染导航栏
function nav(path) {
    var html = "";
    html += `<a href="/" class="mdui-typo-headline folder" style="color: /*#ff5252*/ white"><svg aria-hidden="true" focusable="false" data-prefix="fad" data-icon="crown" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height="28px" style="margin-top: 9px;"><g><path fill="currentColor" d="M544 464v32a16 16 0 0 1-16 16H112a16 16 0 0 1-16-16v-32a16 16 0 0 1 16-16h416a16 16 0 0 1 16 16z" style="opacity: .5"></path><path fill="currentColor" d="M640 176a48 48 0 0 1-48 48 49 49 0 0 1-7.7-.8L512 416H128L55.7 223.2a49 49 0 0 1-7.7.8 48.36 48.36 0 1 1 43.7-28.2l72.3 43.4a32 32 0 0 0 44.2-11.6L289.7 85a48 48 0 1 1 60.6 0l81.5 142.6a32 32 0 0 0 44.2 11.6l72.4-43.4A47 47 0 0 1 544 176a48 48 0 0 1 96 0z"></path></g></svg></a>`;
    var arr = path.trim('/').split('/');
    var p = '/';
    if (arr.length > 0) {
        for (var i in arr) {
            var n = arr[i];
            n = decodeURI(n);
            p += n + '/';
            if (n === '') {
                break;
            }
            html += `<i class="mdui-icon material-icons mdui-icon-dark folder" style="margin:0;">chevron_right</i><a class="folder" href="${p}">${n}</a>`;
        }
    }
    $('#nav').html(html);
}

// 渲染文件列表
function list(path) {
    var content = `
	<div id="head_md" class="mdui-typo" style="display:none;padding: 20px 0;"></div>

	 <div class="mdui-row">
	  <ul class="mdui-list">
	  </ul> 
	 </div> 
	 <div id="list" class="mdui-row-xs-1 mdui-row-sm-2 mdui-row-md-3 mdui-row-lg-3 mdui-row-xl-3">
	 </div>
	 <div id="readme_md" class="mdui-typo" style="display:none; padding: 20px 0;"></div>
	`;
    $('#content').html(content);

    var password = localStorage.getItem('password' + path);
    $('#list').html(`<div class="mdui-progress"><div class="mdui-progress-indeterminate"></div></div>`);
    $('#readme_md').hide().html('');
    $('#head_md').hide().html('');
    $.post(path, '{"password":"' + password + '"}', function(data, status) {
        var obj = jQuery.parseJSON(data);
        if (typeof obj !== null && obj.hasOwnProperty('error') && obj.error.code == '401') {
            var pass = prompt("Please enter password:");
            localStorage.setItem('password' + path, pass);
            if (pass !== null && pass !== "") {
                list(path);
            } else {
                history.go(-1);
            }
        } else if (typeof obj !== null) {
            list_files(path, obj.files);
            lazyLoadInstance.update();
        }
    });
}

function sortDate(array) {
    array.sort(function(a, b) {
        var x = a.modifiedTime.toLowerCase();
        var y = b.modifiedTime.toLowerCase();
        if (y < x) { return -1; }
        if (y > x) { return 1; }
        return 0;
    });
}

function list_files(path, files) {
    html = "";
    sortDate(files);
    for (var i in files) {
        var item = files[i];
        var p = path + item.name + '/';
        if (item.size === undefined) {
            item.size = "";
        }

        item.modifiedTime = utc2beijing(item.modifiedTime);
        item.size = humanFileSize(item.size, false);
        if (item.mimeType == 'application/vnd.google-apps.folder') {
            /*html += `<li class="mdui-list-item mdui-ripple"><a href="${p}" class="folder">
	            <div class="mdui-col-xs-12 mdui-col-sm-8 mdui-text-truncate file-name"><i class="mdui-icon material-icons">folder_open</i> ${item.name}</div>
	            <div class="mdui-col-sm-3 mdui-text-right file-date">${item['modifiedTime']}</div>
	            <div class="mdui-col-sm-1 mdui-text-right file-size">${item['size']}</div>
	            </a>
	        </li>`;*/
        } else {
            p = path + item.name;
            var c = "file";
            if (item.name == "README.md") {
                get_file(p, item, function(data) {
                    markdown("#readme_md", data);
                });
            }
            if (item.name == "HEAD.md") {
                get_file(p, item, function(data) {
                    markdown("#head_md", data);
                });
            }
            var ext = p.split('.').pop();
            if ("|html|php|css|go|java|js|json|txt|sh|md|mp4|webm|avi|m4v|bmp|jpg|jpeg|png|gif|m4a|mp3|wav|ogg|mpg|mpeg|mkv|rm|rmvb|mov|wmv|asf|ts|flv|flac|".indexOf(`|${ext}|`) >= 0) {
                p += "?a=view";
                c += " view";
            }

            // file icons
            /*var fileicon;
            if (("|mp4|webm|avi|mpg|mpeg|mkv|rm|rmvb|mov|wmv|asf|ts|flv|".indexOf(`|${ext}|`) >= 0)) {
                fileicon = "movie_creation";
            }else if (("|mp3|wav|ogg|m4a|flac|".indexOf(`|${ext}|`) >= 0)) {
                fileicon = "music_note";
            }else if (("|bmp|jpg|jpeg|png|gif|".indexOf(`|${ext}|`) >= 0)) {
                fileicon = "photo";
            }else{
                fileicon = "insert_drive_file";
            }
            */

            var thumb = item.thumbnailLink;
            if (thumb) {
                thumb = thumb.replace("=s220", "=h450-w800-p");
            } else {
                thumb = "";
            }
            var quality = "";
            var duration = "processing";
            if (item.videoMediaMetadata) {
                quality = item.videoMediaMetadata.height;

                if (quality >= 2160) {
                    quality = "4K";
                } else if (quality >= 1440) {
                    quality = "FHD+";
                } else if (quality >= 1080) {
                    quality = "FHD";
                } else if (quality >= 720) {
                    quality = "HD";
                } else if (quality > 0) {
                    quality = quality + "p";
                } else {
                    quality = "";
                }

                duration = item.videoMediaMetadata.durationMillis;

                if (duration == 0) {
                    duration = "processing";
                } else {
                    duration = millisToMinutesAndSeconds(duration);
                }
            }

            var name = item.name.split('.').slice(0, -1).join('.');

            html += `
    <div class="mdui-col">
        <div style="margin-bottom: 8px;margin-top: 4px;overflow: hidden;text-overflow: ellipsis;">
            <a href="${p}" class="view">
                <div class="img-container">
                    <img data-src="${thumb}" class="mdui-img-fluid mdui-img-rounded thumb lazy" />
                    <div class="tag"><b>${quality}</b> ${duration}</div>
                </div>
            
            <p style="width: 100%;text-overflow: ellipsis;font-size: 16px;overflow: hidden;">${name}</p>
            </a>
        </div>
    </div>`;
        }
    }
    $('#list').html(html);
    imgResize();
}

function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

function get_file(path, file, callback) {
    var key = "file_path_" + path + file.modifiedTime;
    var data = localStorage.getItem(key);
    if (data != undefined) {
        return callback(data);
    } else {
        $.get(path, function(d) {
            localStorage.setItem(key, d);
            callback(d);
        });
    }
}



// 文件展示 ?a=view
function file(path) {
    var name = path.split('/').pop();
    var ext = name.split('.').pop().toLowerCase().replace(`?a=view`, "");
    if ("|html|php|css|go|java|js|json|txt|sh|md|".indexOf(`|${ext}|`) >= 0) {
        return file_code(path);
    }

    if ("|mp4|webm|avi|mpg|mpeg|mkv|rm|rmvb|mov|wmv|asf|ts|flv|m4v|".indexOf(`|${ext}|`) >= 0) {
        return _file_video(path);
    }

    if ("|mp3|wav|ogg|m4a|flac|".indexOf(`|${ext}|`) >= 0) {
        return file_audio(path);
    }

    if ("|bmp|jpg|jpeg|png|gif|".indexOf(`|${ext}|`) >= 0) {
        return file_image(path);
    }
}

// 文件展示 |html|php|css|go|java|js|json|txt|sh|md|
function file_code(path) {
    var type = {
        "html": "html",
        "php": "php",
        "css": "css",
        "go": "golang",
        "java": "java",
        "js": "javascript",
        "json": "json",
        "txt": "text",
        "sh": "sh",
        "md": "markdown",
    };
    var name = path.split('/').pop();
    var ext = name.split('.').pop();
    var href = window.location.origin + path;
    href = encodeURI(href);
    var content = `
<div class="code-editor">
<pre id="editor"></pre>
</div>
<div class="mdui-textfield">
	<label class="mdui-textfield-label">Direct donwload link</label>
	<input readonly class="mdui-textfield-input" type="text" value="${href}"/>
</div>
<a href="${href}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>

<script src="https://cdn.staticfile.org/ace/1.4.8/ace.js"></script>
<script src="https://cdn.staticfile.org/ace/1.4.8/ext-language_tools.js"></script>
	`;
    $('#content').html(content);

    $.get(path, function(data) {
        $('#editor').html($('<div/>').text(data).html());
        var code_type = "Text";
        if (type[ext] != undefined) {
            code_type = type[ext];
        }
        var editor = ace.edit("editor");
        editor.setTheme("ace/theme/dracula");
        editor.setFontSize(16);
        editor.session.setMode("ace/mode/" + code_type);
        editor.setReadOnly(true);

        //Autocompletion
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            maxLines: Infinity
        });
    });
}


function _file_video(path) {
    var password = localStorage.getItem('password' + path);

    $.post(path, '{"password":"' + password + '"}', function(data, status) {
        var obj = jQuery.parseJSON(data);
        if (typeof obj !== null && obj.hasOwnProperty('error') && obj.error.code == '401') {
            var pass = prompt("Please enter password:");
            localStorage.setItem('password' + path, pass);
            if (pass != null && pass != "") {
                file_video(path);
            } else {
                history.go(-1);
            }
        } else if (typeof obj != null) {
            file_video(path, obj);
        }
    });
}


function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

// 文件展示 视频 |mp4|webm|avi|
function file_video(path, file) {

    var des;
    if (isJson(file.description)) {
        des = JSON.parse(file.description);
    }

    var url = window.location.origin + path;
    url = decodeURI(url);
    url = encodeURI(url);

    var playBtn = `<a class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-theme-accent" href="potplayer://${url}"><i class="mdui-icon material-icons">play_circle_filled</i> Potplayer</a>`;
    if (/(iPhone|iPad|iPod|iOS|Android)/i.test(navigator.userAgent)) { //移动端
        playBtn = `<a class="mdui-btn mdui-btn-raised mdui-ripple mdui-color-theme-accent" href="vlc://${url}"><i class="mdui-icon material-icons">play_circle_outline</i> VLC Player</a>`;
    }
    var content = `
	<div class="mdui-row video">
	<video id="player" class="mdui-video-fluid mdui-center" poster="https://cdn.jsdelivr.net/gh/jazz511/goindex@red/assets/thumb1280x720-black-min.png" preload playsinline controls>
	</video>
	</div>
	<div class="mdui-container-fluid">
	<br>${playBtn}
	<!-- 固定标签 -->
	<div class="mdui-textfield">
	  <label class="mdui-textfield-label">Direct download link</label>
	  <input readonly class="mdui-textfield-input" type="text" value="${url}"/>
	</div>
	<div class="mdui-textfield">
	  <label class="mdui-textfield-label">Embed code</label>
	  <textarea readonly class="mdui-textfield-input"><video><source src="${url}" type="video/mp4"></video></textarea>
	</div>
</div>
<a download href="${url}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>
	`;
    $('#content').html(content);

    const player = new Plyr('#player', {
        speed: { selected: 1, options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
        tooltips: { controls: false, seek: true },
        storage: { enabled: true, key: 'royal' },
        previewThumbnails: { enabled: false },
        controls: [
            'play-large', // The large play button in the center
            'rewind', // Rewind by the seek time (default 10 seconds)
            'play', // Play/pause playback
            'fast-forward', // Fast forward by the seek time (default 10 seconds)
            'progress', // The progress bar and scrubber for playback and buffering
            'current-time', // The current time of playback
            'duration', // The full duration of the media
            'captions', // Toggle captions
            'settings', // Settings menu
            'pip', // Picture-in-picture (currently Safari only)
            'airplay', // Airplay (currently Safari only)
            'fullscreen', // Toggle fullscreen
        ],
    });

    var quality;
    if (file.videoMediaMetadata) {
        quality = file.videoMediaMetadata.height;
    } else if (des && des.quality) {
        quality = Math.max(...des.quality);
    } else {
        quality = 1080;
    }

    var qu = [{
        src: url,
        type: 'video/mp4',
        size: quality,
    }];

    if (des && des.quality) {
        for (var i in des.quality) {
            if (des.quality[i] != quality) {
                qu.push({
                    src: window.location.origin + "/res/" + des.quality[i] + path,
                    type: 'video/mp4',
                    size: des.quality[i],
                });
            }
        }
    }

    player.source = {
        type: 'video',
        sources: qu,
        poster: 'https://cdn.jsdelivr.net/gh/jazz511/goindex@red/assets/thumb1280x720-black-min.png',
    };

    var name = file.name.split('.').slice(0, -1).join('.');
    var thumb = file.thumbnailLink;
    var thumb96 = "";
    var thumb128 = "";
    var thumb192 = "";
    var thumb256 = "";
    var thumb384 = "";
    var thumb512 = "";
    if (thumb) {
        thumb96 = thumb.replace("=s220", "=h128-w128-p");
        thumb128 = thumb.replace("=s220", "=h128-w128-p");
        thumb192 = thumb.replace("=s220", "=h192-w192-p");
        thumb256 = thumb.replace("=s220", "=h256-w256-p");
        thumb384 = thumb.replace("=s220", "=h384-w384-p");
        thumb512 = thumb.replace("=s220", "=h512-w512-p");
    }

    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: name,
            artist: document.siteName,
            artwork: [
                { src: thumb96, sizes: '96x96', type: 'image/png' },
                { src: thumb128, sizes: '128x128', type: 'image/png' },
                { src: thumb192, sizes: '192x192', type: 'image/png' },
                { src: thumb256, sizes: '256x256', type: 'image/png' },
                { src: thumb384, sizes: '384x384', type: 'image/png' },
                { src: thumb512, sizes: '512x512', type: 'image/png' },
            ]
        });
    }
}

// 文件展示 音频 |mp3|m4a|wav|ogg|
function file_audio(path) {
    var url = window.location.origin + path;
    url = encodeURI(url);
    var content = `
<div class="mdui-container-fluid">
	<br>
	<audio class="mdui-center" preload controls>
	  <source src="${url}"">
	</audio>
	<br>
	<!-- 固定标签 -->
	<div class="mdui-textfield">
	  <label class="mdui-textfield-label">Direct download link</label>
	  <input readonly class="mdui-textfield-input" type="text" value="${url}"/>
	</div>
	<div class="mdui-textfield">
	  <label class="mdui-textfield-label">Embed code</label>
	  <textarea readonly class="mdui-textfield-input"><audio><source src="${url}"></audio></textarea>
	</div>
</div>
<a href="${url}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>
	`;
    $('#content').html(content);
}


// 图片展示
function file_image(path) {
    var url = window.location.origin + path;
    url = encodeURI(url);
    var content = `
<div class="mdui-container-fluid">
	<br>
	<img class="mdui-img-fluid mdui-center" src="${url}"/>
	<br>
	<div class="mdui-textfield">
	  <label class="mdui-textfield-label">Direct download link</label>
	  <input readonly class="mdui-textfield-input" type="text" value="${url}"/>
	</div>
	<div class="mdui-textfield">
	  <label class="mdui-textfield-label">Embed code</label>
	  <input readonly class="mdui-textfield-input" type="text" value="<img src='${url}' />"/>
	</div>
        <div class="mdui-textfield">
	  <label class="mdui-textfield-label">Markdown</label>
	  <input readonly class="mdui-textfield-input" type="text" value="![](${url})"/>
	</div>
        <br>
</div>
<a href="${url}" class="mdui-fab mdui-fab-fixed mdui-ripple mdui-color-theme-accent"><i class="mdui-icon material-icons">file_download</i></a>
	`;
    $('#content').html(content);
}


//时间转换
function utc2beijing(utc_datetime) {
    // 转为正常的时间格式 年-月-日 时:分:秒
    var T_pos = utc_datetime.indexOf('T');
    var Z_pos = utc_datetime.indexOf('Z');
    var year_month_day = utc_datetime.substr(0, T_pos);
    var hour_minute_second = utc_datetime.substr(T_pos + 1, Z_pos - T_pos - 1);
    var new_datetime = year_month_day + " " + hour_minute_second; // 2017-03-31 08:02:06

    // 处理成为时间戳
    timestamp = new Date(Date.parse(new_datetime));
    timestamp = timestamp.getTime();
    timestamp = timestamp / 1000;

    // 增加8个小时，北京时间比utc时间多八个时区
    var unixtimestamp = timestamp + 1 * 60 * 60;

    // 时间戳转为时间
    unixtimestamp = new Date(unixtimestamp * 1000);
    var year = 1900 + unixtimestamp.getYear();
    var month = "0" + (unixtimestamp.getMonth() + 1);
    var date = "0" + unixtimestamp.getDate();
    var hour = "0" + unixtimestamp.getHours();
    var minute = "0" + unixtimestamp.getMinutes();
    var second = "0" + unixtimestamp.getSeconds();
    return year + "-" + month.substring(month.length - 2, month.length) + "-" + date.substring(date.length - 2, date.length) +
        " " + hour.substring(hour.length - 2, hour.length) + ":" +
        minute.substring(minute.length - 2, minute.length) + ":" +
        second.substring(second.length - 2, second.length);
}

// bytes自适应转换到KB,MB,GB
function humanFileSize(bytes, si) {
    if (!bytes) {
        bytes = '';
        return bytes;
    } else {
        var thresh = si ? 1000 : 1024;
        if (Math.abs(bytes) < thresh) {
            return bytes + ' B';
        }
        var units = si ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'] : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
        var u = -1;
        do {
            bytes /= thresh;
            ++u;
        } while (Math.abs(bytes) >= thresh && u < units.length - 1);

        return bytes.toFixed(1) + ' ' + units[u];
    }
}

String.prototype.trim = function(char) {
    if (char) {
        return this.replace(new RegExp('^\\' + char + '+|\\' + char + '+$', 'g'), '');
    }
    return this.replace(/^\s+|\s+$/g, '');
};


// README.md HEAD.md 支持
function markdown(el, data) {
    if (window.md == undefined) {
        //$.getScript('https://cdn.jsdelivr.net/npm/markdown-it@10.0.0/dist/markdown-it.min.js',function(){
        window.md = window.markdownit();
        markdown(el, data);
        //});
    } else {
        var html = md.render(data);
        $(el).show().html(html);
    }
}

// 监听回退事件
window.onpopstate = function() {
    var path = window.location.pathname;
    render(path);
};


$(function() {
    init();
    var path = window.location.pathname;
    $("body").on("click", '.folder', function() {
        var url = $(this).attr('href');
        history.pushState(null, null, url);
        render(url);
        return false;
    });

    $("body").on("click", '.view', function() {
        var url = $(this).attr('href');
        history.pushState(null, null, url);
        render(url);
        return false;
    });

    render(path);
});

function search() {
    var e, t, n, l;
    for (e = document.getElementById("search").value.toUpperCase(), t = document.getElementById("list").getElementsByTagName("li"), l = 0; l < t.length; l++)((n = t[l].getElementsByTagName("a")[0]).textContent || n.innerText).toUpperCase().indexOf(e) > -1 ? t[l].style.display = "" : t[l].style.display = "none";
}
