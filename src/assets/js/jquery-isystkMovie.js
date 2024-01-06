(function($) {
    /*
     * isystkMovie
     *
	 * Copyright (c) 2024 iseyoshitaka
     *
     */
    $.fn.isystkMovie = function(options, callback) {

        $.fn.isystkMovie.addStyleCmp = false;

        var params = $.extend({}, $.fn.isystkMovie.defaults, options);

        var callbackfunc = null,
            clickCallback = null,
            resizeCallback = null,
            playCallback = null,
            pauseCallback = null,
            endedCallback = null,
            muteDefault = null,
            hideDownload = null,
            clickPlay = null;

        // jQueryオブジェクトキャッシュ、初期設定を行う
        var init = function(obj) {
            callbackfunc = callback || params.callbackfunc;
            clickCallback = params.clickCallback;
            resizeCallback = params.resizeCallback;
            playCallback = params.playCallback;
            pauseCallback = params.pauseCallback;
            endedCallback = params.endedCallback;
            muteDefault = params.muteDefault;
            hideDownload = params.hideDownload;
            clickPlay = params.clickPlay;
            var targetImg = $(obj);
            var width = targetImg.width() || 0;
            var height = targetImg.height() || 0;
            var playTime = targetImg.data('playtime') || '';
            var isPlay = targetImg.hasClass('play');
            var imagePath = targetImg.attr('osrc') || targetImg.attr('src') || '';
            var video = null;
            var movieBox = $(['<div class="movieBox" >',
                '<div class="playBtn"></div>',
                '<div class="playTime display-none"><span>'+playTime+'</span></div>',
                '</div>'
            ].join(''));

            this.exec = function exec(callback) {

                if (targetImg.hasClass('movie-end')) {
                    // 既に処理済みの場合は、二重に設定しないように処理を抜ける
                    return;
                }

                var movieDir = imagePath.substring(0, imagePath.lastIndexOf('/')+1).replace( /thumb/g , 'movie');
                var movieFile = imagePath.substring(imagePath.lastIndexOf('/')+1).replace(/([0-9]*)(.*).jpg(.*)/, '$1.mp4$3');
                var moviePath = movieDir + movieFile;
                targetImg.data('moviepath', moviePath);

                var copyImage = targetImg.clone(true);
                var clazz = copyImage.attr('class');
                if (clazz) {
                    movieBox.addClass(clazz);
                }
                copyImage.removeAttr('class');
                movieBox.prepend(copyImage);

                if (playTime !== '') {
                    movieBox.find('.playTime').removeClass('display-none');
                }

                // 動画サムネイルをクリックした際に動画に差し替える。
                if (isPlay) {
                    movieBox.addClass('play');
                    movieBox.bind("click", function(event) {
                        event.preventDefault();

                        if (!$(this).hasClass('play')) {
                            return;
                        }

                        event.stopPropagation();
                        event.stopImmediatePropagation();

                        video = changeVideo($(this), imagePath);
                    });
                }

                movieBox.removeClass('js-movie');
                targetImg.after(movieBox);
                targetImg.hide();
                targetImg.addClass('movie-end');

                if (0 < width && height <= 0) {
                    // 表示サイズの調整
                    var img = $('<img>');
                    img.on('load', function() {
                            var o_width = img[0].width;
                            var o_height = img[0].height;

                            targetImg.attr('owidth', img[0].width);
                            targetImg.attr('oheight', img[0].height);

                            // アスペクト比からheightを算出
                            height = Math.floor(o_height * width / o_width);
                            setPartsPosition(movieBox, width, height);

                            if (callback) {
                                callback(movieBox);
                            }
                        });
                    img.attr('src', imagePath);
                } else if (width <= 0 && 0 < height) {
                    // 表示サイズの調整
                    var img = $('<img>');
                    img.on('load', function() {

                            var o_width = img[0].width;
                            var o_height = img[0].height;

                            targetImg.attr('owidth', img[0].width);
                            targetImg.attr('oheight', img[0].height);

                            // アスペクト比からwidthを算出
                            width = Math.floor(o_width * height / o_height);
                            setPartsPosition(movieBox, width, height);

                            if (callback) {
                                callback(movieBox);
                            }
                        });
                    img.attr('src', imagePath);
                } else if (width <= 0 || height <= 0) {
                    // 表示サイズの調整
                    var img = $('<img>');
                    img.on('load', function() {

                            var o_width = img[0].width;
                            var o_height = img[0].height;

                            targetImg.attr('owidth', img[0].width);
                            targetImg.attr('oheight', img[0].height);

                            setPartsPosition(movieBox, o_width, o_height);

                            if (callback) {
                                callback(movieBox);
                            }
                        });
                    img.attr('src', imagePath);
                } else {
                    // 表示サイズの調整
                    var img = $('<img>');
                    img.on('load', function() {

                            var o_width = img[0].width;
                            var o_height = img[0].height;

                            targetImg.attr('owidth', img[0].width);
                            targetImg.attr('oheight', img[0].height);

                            setPartsPosition(movieBox, width, height);

                            if (callback) {
                                callback(movieBox);
                            }
                        });
                    img.attr('src', imagePath);
                }

                // imgタグをvidoタグに置き換える
                var changeVideo = function (target, imagePath) {
                    var self = target,
                        image = self.find('img'),
                        width = image.attr('width'),
                        height = image.attr('height'),
                        moviePath = image.data('moviepath') || '';

                    // 初期音量をMUTEにするかどうか
                    var muted = muteDefault ? 'muted' : '';

                    var video = $(['<video controls="" poster="'+imagePath+'" playsinline disablepictureinpicture controlslist="nodownload" ' + muted + ' >',
                        '<source src="'+moviePath+'">',
                        '<p>ご利用のブラウザではvideoが利用できません。別ブラウザをご利用下さい</p>',
                        '</video>'].join(''));

                    video.css('margin', 'auto').css('display', 'block');
                    if (width) {
                        video.css('width', width);
                    } else if (height) {
                        video.css('height', height);
                    }

                    self.removeClass('movieBox');
                    var clazz = self.attr('class');
                    if (clazz) {
                        video.addClass(clazz);
                    }

                    self.after(video);
                    self.remove();

                    if (clickCallback) {
                        clickCallback({video: video});
                    }

                    (function() {

                        if (clickPlay) {
                            bindVideoClick(video);
                        }

                        // 動画が再生開始された時
                        video[0].addEventListener("play", function(){
                            if (playCallback) {
                                playCallback();
                            }
                        }, true);

                        // 動画が停止された時
                        video[0].addEventListener("pause", function(){
                            if (pauseCallback) {
                                pauseCallback();
                            }
                        }, true);

                        // 動画が再生完了した時
                        video[0].addEventListener("ended", function(){
                            if (endedCallback) {
                                endedCallback();
                            }
                        }, true);

                        playVideo(video);

                    })();

                    return video;
                };
            };
        };

        // 動画を再生します。
        var playVideo = function (video) {
            if (!video[0].paused) {
                return;
            }
            video[0].play();
        };

        // 動画を停止します。
        var pauseVideo =  function (video) {
            if (video[0].paused) {
                return;
            }
            video[0].pause();
        };

        var bindVideoClick = $.fn.isystkMovie.bindVideoClick = function (video) {
            $(video).each(function() {
                $(this).bind('click',function(event){
                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    if (video[0].paused) {
                        playVideo(video);
                    } else {
                        pauseVideo(video);
                    }
                });
            });
        };

        // 動画サムネイルの「再生ボタン」・「再生時間」の表示位置を調整します。
        var setPartsPosition = $.fn.isystkMovie.setPartsPosition = function (movieBox, w, h) {
            var playBtnWidth = 0;
            var playBtnHeight = 0;
            if (w < h) {
                // 縦長の場合
                playBtnWidth = Math.floor(w * 0.3);
                playBtnHeight = Math.floor(w * 0.3);
                movieBox.find('.playBtn').css('width','30%');
                movieBox.find('.playBtn').css('height','');
            } else {
                // 横長の場合
                playBtnWidth = Math.floor(h * 0.3);
                playBtnHeight = Math.floor(h * 0.3);
                movieBox.find('.playBtn').css('width','');
                movieBox.find('.playBtn').css('height','30%');
            }

            var playBtnTop = Math.floor((h * 0.5) - (playBtnHeight * 0.5));
            var playBtnLeft = Math.floor((w * 0.5) - (playBtnWidth * 0.5));
            var playTimeFontSize = Math.floor(playBtnWidth * 0.25);
            if (20 < playTimeFontSize) {
                playTimeFontSize = 20;
            }
            var playTimeTop = Math.floor(h - (2 * playTimeFontSize));

            console.log({
                playBtnTop,
                playBtnLeft
            })
            movieBox.css('width', w + 'px').css('height', h + 'px');
            movieBox.find('.playBtn').css('top', playBtnTop + 'px').css('left', playBtnLeft + 'px');
            movieBox.find('.playTime').css('top', playTimeTop + 'px').css('font-size', playTimeFontSize + 'px');

        };

        // 画面が回転された場合
        var restore = function(obj) {
            var target = [];
            $(obj).each(function() {
                var self = $(this);
                if (!self.hasClass('movieBox') || self.hasClass('noRestore')) {
                    return;
                }
                var image = self.prev();
                self.remove();
                image.show();
                target.push(image);
            });

            var maxCount = target.length;
            var movieBoxs = [];
            $(target).each(function() {
                new init(this).exec(function(movieBox) {
                    movieBoxs.push(movieBox);
                    maxCount--;
                    if (maxCount === 0 && callbackfunc) {
                        callbackfunc(movieBoxs);
                    }
                });
            });
        }

        var obj = $(this);

        // 実機の場合は回転処理、それ以外はリサイズ処理
        if (0>navigator.userAgent.indexOf('iPhone') && 0>navigator.userAgent.indexOf('iPad') && 0>navigator.userAgent.indexOf('iPod') && 0>navigator.userAgent.indexOf('Android')) {
//			// 画面がリサイズされた場合
//			$(window).resize(function() {
//				restore(obj.next());
//				if (resizeCallback) {
//					resizeCallback(obj);
//				}
//			});
        } else {
            // 画面が回転された場合
            $(window).on('orientationchange',function(){
                setTimeout(function(){
                    restore(obj.next());
                    if (resizeCallback) {
                        resizeCallback(obj);
                    }
                },200);
            });
        }

        (function() {
            var maxCount = obj.length;
            var movieBoxs = [];
            obj.each(function() {
                new init(this).exec(function(movieBox) {
                    movieBoxs.push(movieBox);
                    maxCount--;
                    if (maxCount === 0 && callbackfunc) {
                        callbackfunc(movieBoxs);
                    }
                });
            });
        })();

        return this;
    }

    $.fn.isystkMovie.defaults = {
        callbackfunc : null,
        clickCallback : null,
        resizeCallback : null,
        playCallback : null,
        pauseCallback : null,
        endedCallback : null,
        muteDefault : false, // 動画再生時の初期音量をMUTEにするかどうか
        hideDownload : true, // ダウンロードボタンを非表示とするかどうか
        clickPlay : true, // videoタグクリック時に動画再生・停止を制御する。
    }

})(jQuery);
