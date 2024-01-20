(function ($) {
    /*
     * 動画再生
     * 
     * Copyright (c) 2024 iseyoshitaka
     */
    $.fn.isystkMovie = function (options) {

        $.fn.isystkMovie.addStyleCmp = false;

        const params = $.extend({}, $.fn.isystkMovie.defaults, options);

        let callbackfunc = null,
            clickCallback = null,
            resizeCallback = null,
            playCallback = null,
            pauseCallback = null,
            endedCallback = null,
            muteDefault = null,
            hideDownload = null,
            clickPlay = null;

        // jQueryオブジェクトキャッシュ、初期設定を行う
        const init = function (obj) {
            callbackfunc = params.callbackfunc;
            clickCallback = params.clickCallback;
            resizeCallback = params.resizeCallback;
            playCallback = params.playCallback;
            pauseCallback = params.pauseCallback;
            endedCallback = params.endedCallback;
            muteDefault = params.muteDefault;
            hideDownload = params.hideDownload;
            clickPlay = params.clickPlay;
            const targetImg = $(obj);
            let width = targetImg.width() || 0;
            let height = targetImg.height() || 0;
            const playTime = targetImg.data('playtime') || '';
            const isPlay = targetImg.hasClass('play');
            const isModalPlay = targetImg.hasClass('modal-play');
            const imagePath = targetImg.attr('osrc') || targetImg.attr('src') || '';
            let video = null;
            const movieBox = $(['<div class="movieBox" >',
                '<div class="playBtn"></div>',
                '<div class="playTime" style="display: none"><span>' + playTime + '</span></div>',
                '</div>'
            ].join(''));

            this.exec = function exec(callback) {

                if (targetImg.hasClass('movie-end')) {
                    // 既に処理済みの場合は、二重に設定しないように処理を抜ける
                    return;
                }

                const moviePath = imagePath
                    .replace(/images/g, 'movies')
                    .replace(/_sd/g, '')
                    .replace(/\.jpg/, '.mp4');
                targetImg.data('moviepath', moviePath);

                const copyImage = targetImg.clone(true);
                const clazz = copyImage.attr('class');
                if (clazz) {
                    movieBox.addClass(clazz);
                }
                copyImage.removeAttr('class');
                movieBox.prepend(copyImage);

                if (playTime !== '') {
                    movieBox.find('.playTime').show();
                }

                // 動画サムネイルをクリックした際に動画に差し替える。
                if (isPlay) {
                    movieBox.addClass('play');
                    movieBox.bind("click", function (event) {
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

                // 動画サムネイルをクリックした際にモーダルで動画を表示する。
                if (isModalPlay) {
					targetImg.addClass('zoom');
					const targetImgParent = movieBox.parent();
                    targetImgParent.attr('page-no', 1);
                    targetImgParent.zoomSlider({
                        targetClass: '.zoom',
                        vertical: true,
                        moviePlay: true,
                        carousel: false,
                    });
                }

                if (0 < width && height <= 0) {
                    // 表示サイズの調整
                    const img = $('<img>');
                    img.on('load', function () {
                        const o_width = img[0].width;
                        const o_height = img[0].height;

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
                    const img = $('<img>');
                    img.on('load', function () {

                        const o_width = img[0].width;
                        const o_height = img[0].height;

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
                    const img = $('<img>');
                    img.on('load', function () {

                        const o_width = img[0].width;
                        const o_height = img[0].height;

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
                    const img = $('<img>');
                    img.on('load', function () {

                        const o_width = img[0].width;
                        const o_height = img[0].height;

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
                const changeVideo = function (target, imagePath) {
                    const self = target,
                        image = self.find('img'),
                        width = image.attr('width'),
                        height = image.attr('height'),
                        moviePath = image.data('moviepath') || '';

                    // 初期音量をMUTEにするかどうか
                    const muted = muteDefault ? 'muted' : '';

                    const video = $(['<video controls="" poster="' + imagePath + '" playsinline disablePictureInPicture controlslist="nodownload" ' + muted + ' >',
                        '<source src="' + moviePath + '">',
                        '<p>ご利用のブラウザではvideoが利用できません。別ブラウザをご利用下さい</p>',
                        '</video>'].join(''));

                    video.css('margin', 'auto').css('display', 'block');
                    if (width) {
                        video.css('width', width);
                    } else if (height) {
                        video.css('height', height);
                    }

                    self.removeClass('movieBox');
                    const clazz = self.attr('class');
                    if (clazz) {
                        video.addClass(clazz);
                    }

                    self.after(video);
                    self.remove();

                    if (clickCallback) {
                        clickCallback({video: video});
                    }

                    if (clickPlay) {
                        bindVideoClick(video);
                    }

                    // 動画が再生開始された時
                    video[0].addEventListener("play", function () {
                        if (playCallback) {
                            playCallback();
                        }
                    }, true);

                    // 動画が停止された時
                    video[0].addEventListener("pause", function () {
                        if (pauseCallback) {
                            pauseCallback();
                        }
                    }, true);

                    // 動画が再生完了した時
                    video[0].addEventListener("ended", function () {
                        if (endedCallback) {
                            endedCallback();
                        }
                    }, true);

                    playVideo(video);

                    return video;
                };
            };
        };

        // 動画を再生します。
        const playVideo = function (video) {
            if (!video[0].paused) {
                return;
            }
            video[0].play();
        };

        // 動画を停止します。
        const pauseVideo = function (video) {
            if (video[0].paused) {
                return;
            }
            video[0].pause();
        };

        const bindVideoClick = $.fn.isystkMovie.bindVideoClick = function (video) {
            $(video).each(function () {
                $(this).bind('click', function (event) {
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
        const setPartsPosition = $.fn.isystkMovie.setPartsPosition = function (movieBox, w, h) {
            let playBtnWidth = 0;
            let playBtnHeight = 0;
            if (w < h) {
                // 縦長の場合
                playBtnWidth = Math.floor(w * 0.3);
                playBtnHeight = Math.floor(w * 0.3);
                movieBox.find('.playBtn').css('width', '30%');
                movieBox.find('.playBtn').css('height', '');
            } else {
                // 横長の場合
                playBtnWidth = Math.floor(h * 0.3);
                playBtnHeight = Math.floor(h * 0.3);
                movieBox.find('.playBtn').css('width', '');
                movieBox.find('.playBtn').css('height', '30%');
            }

            const playBtnTop = Math.floor((h * 0.5) - (playBtnHeight * 0.5));
            const playBtnLeft = Math.floor((w * 0.5) - (playBtnWidth * 0.5));
            let playTimeFontSize = Math.floor(playBtnWidth * 0.25);
            if (20 < playTimeFontSize) {
                playTimeFontSize = 20;
            }
            const playTimeTop = Math.floor(h - (2 * playTimeFontSize));

            movieBox.css('width', w + 'px').css('height', h + 'px');
            movieBox.find('.playBtn').css('top', playBtnTop + 'px').css('left', playBtnLeft + 'px');
            movieBox.find('.playTime').css('top', playTimeTop + 'px').css('font-size', playTimeFontSize + 'px');

        };

        // 画面が回転された場合
        const restore = function (obj) {
            const target = [];
            $(obj).each(function () {
                const self = $(this);
                if (!self.hasClass('movieBox') || self.hasClass('noRestore')) {
                    return;
                }
                const image = self.prev();
                self.remove();
                image.show();
                target.push(image);
            });

            let maxCount = target.length;
            const movieBoxs = [];
            $(target).each(function () {
                new init(this).exec(function (movieBox) {
                    movieBoxs.push(movieBox);
                    maxCount--;
                    if (maxCount === 0 && callbackfunc) {
                        callbackfunc(movieBoxs);
                    }
                });
            });
        }

        const target = $(this);

        // 実機の場合は回転処理、それ以外はリサイズ処理
        if (0 > navigator.userAgent.indexOf('iPhone') && 0 > navigator.userAgent.indexOf('iPad') && 0 > navigator.userAgent.indexOf('iPod') && 0 > navigator.userAgent.indexOf('Android')) {
//			// 画面がリサイズされた場合
//			$(window).resize(function() {
//				restore(obj.next());
//				if (resizeCallback) {
//					resizeCallback(obj);
//				}
//			});
        } else {
            // 画面が回転された場合
            $(window).on('orientationchange', function () {
                setTimeout(function () {
                    restore(obj.next());
                    if (resizeCallback) {
                        resizeCallback(obj);
                    }
                }, 200);
            });
        }

        let maxCount = target.length;
        const movieBoxs = [];
        target.each(function () {
            new init(this).exec(function (movieBox) {
                movieBoxs.push(movieBox);
                maxCount--;
                if (maxCount === 0 && callbackfunc) {
                    callbackfunc(movieBoxs);
                }
            });
        });

        return this;
    }

    $.fn.isystkMovie.defaults = {
        callbackfunc: null,
        clickCallback: null,
        resizeCallback: null,
        playCallback: null,
        pauseCallback: null,
        endedCallback: null,
        muteDefault: false, // 動画再生時の初期音量をMUTEにするかどうか
        hideDownload: true, // ダウンロードボタンを非表示とするかどうか
        clickPlay: true, // videoタグクリック時に動画再生・停止を制御する。
    }

})(jQuery);
