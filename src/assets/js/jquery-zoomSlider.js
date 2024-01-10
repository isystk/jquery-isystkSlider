(function ($) {
    /*
     * 拡大スライダー
     * 
     * Copyright (c) 2024 iseyoshitaka
     */
    $.fn.zoomSlider = function (options) {

        const params = $.extend({}, $.fn.zoomSlider.defaults, options);

        const className = "zoomSlider";

        // 初期設定
        const init = (obj) => {

            const screen = $(obj),
                targetClass = params.targetClass;

            const targets = screen
                .find(targetClass)
                .filter(function () {
                    if($(this).closest('.child').hasClass('cloned')) {
                        // カルーセルありの場合はクローンされたDOMを除外する
                        return false
                    }
                    return true
                });

            if (targets.length === 0) {
                // 拡大対象が１つもない場合は何もしない。
                return;
            }
            
            const maxPageNo = targets.length
            let currentPageNo = 1;

            /* 対象の画像データを配列に保持する */
            const targetItems = $.makeArray(targets
                .map(function () {
                    let self = $(this);
                    let imagePath = self.attr('src') || '';
                    // オリジナルの画像パスに変更
                    imagePath = imagePath
                        .replace(/_sd/g, '');
                    const caption = self.attr('alt') || '';
                    const isMovie = self.hasClass('js-movie');
                    return {
                        imagePath,
                        caption,
                        isMovie
                    }
                })
            );

            // メインフレームを生成します。
            const makeFlame = () => {

                const mainFlame = $([
                    '<div class="isystk-overlay zoomPhotoPanel" style="width: 100%; height: 100%">',
                        '<a href="#" class="js-close close"></a>',
                        '<div class="js-slider" style="overflow:hidden;margin 0 auto;background-color: #000;">',
                            '<ul class="parentKey photo_enlarge_imageArea">',
                            '</ul>',
                        '</div>',
                        '<div class="photo_enlarge_partsArea">',
                            '<div class="transitionArea transitionList">',
                                '<p class="item prev js-prevBtn" style="position: absolute; top: 52%; left: 5px;' +
                                ' margin-top: -20px;">' +
                                    '<a href="#"></a>' +
                                '</p>',
                                '<p class="item next js-nextBtn" style="position: absolute; top: 52%; right: 5px; margin-top: -20px;">' +
                                    '<a href="#"></a>' +
                                '</p>',
                            '</div>',
                            '<div class="commentArea" style="position: absolute;height: 29%;background: #000;opacity:' +
                            ' 0.8;color:#fff;z-index: 10002;box-sizing: border-box;bottom: 0;width: 100%;padding: 10px;">',
                                '<div class="comment">',
                                    '<p class="caption_txt captionArea"></p>',
                                    '<div style="display: flex;justify-content: center;position:relative;">',
                                        '<p class="count" style="position:absolute;padding: 0 6px;background: #bdaa7d;border-radius: 100px;font-size: 1rem;color: #fff;"></p>',
                                    '</div>',
                                '</div>',
                            '</div>',
                        '</div>',
                    '</div>'
                ].join(''));

                // 生成した拡大パネルに画面内で一意なIDを設定する
                const gallery = $('.' + className);
                let index = 1;
                if (gallery) {
                    index = gallery.length + 1;
                }
                mainFlame.attr('id', 'zoomSlider' + index);
                mainFlame.addClass(className);
                
                $('body').append(mainFlame);

                return mainFlame;
            }

            // 子要素を生成します。
            const makeChild = (pageNo, callback) => {
                pageNo = parseInt(pageNo);

                let page = mainFlame.find('.childKey[zoom-page-no="'+pageNo+'"]');
                if (0 < page.length) {
                    if (callback) {
                        callback(page)
                    }
                    return
                }
                const data = targetItems[pageNo-1]
                const li = $([
                    '<li class="childKey" zoom-page-no="'+pageNo+'" style="text-align: center; margin-top: 0">',
                        '<img src="' + data.imagePath + '" alt="' + data.caption + '" class="' + (data.isMovie ? 'js-movie' : '') + '"/>',
                    '</li>'
                ].join(''));

                const index = findAppendPos(pageNo)
                
                // スライダーの指定位置に生成した子要素を追加
                mainFlame.slider.appendChild(li, index);
                page = mainFlame.find('.childKey[zoom-page-no="'+pageNo+'"]');

                // 子要素の横幅を端末のwidthに設定
                page.width($(window).width());
                page.height($(window).height());

                const images = page.find('img');
                let imageSize = images.length
                images.each(function () {
                    const photo = $(this),
                        imagePath = photo.attr('src') || '';
                    const img = $('<img>');
                    img.on('load', function () {

                        photo.attr('owidth', img[0].width);
                        photo.attr('oheight', img[0].height);

                        images.unbind('load');

                        // 余白の調整
                        appendMargin(photo);

                        if (photo.hasClass('js-movie')) {
                            // 画像を動画再生用サムネイルに変換
                            changeMovieBox(photo);
                        }

                        if (imageSize === 1) {
                            if (callback) {
                                callback(page)
                            }
                        }
                        imageSize--;
                    });
                    img.attr('src', imagePath);
                });
            }

            // 次のDOMを追加する位置を算出します。
            const findAppendPos = function (pageNo) {
                const li = mainFlame.find('.childKey').filter(function () {
                    return !$(this).hasClass('cloned')
                }).clone();
                if (li.length === 0) {
                    return 0;
                }
                let index = -1
                li.each(function (i) {
                    if ($(this).attr("zoom-page-no") === pageNo+"") {
                        index = i;
                        return
                    }
                });
                if(index < 0) {
                    pageNo = pageNo - 1;
                    if (pageNo === 0) {
                        return 0;
                    }
                    return findAppendPos(pageNo)
                }
                return index+1;
            };
            
            // イベントバンドル
            const bindEvents = (mainFlame) => {

                // 画像スライダー
                const slider = mainFlame.slider = mainFlame.find('.js-slider').isystkSlider({
                    'parentKey': '.parentKey'
                    , 'childKey': '.childKey'
                    , 'shift': 1
                    , 'swipe': true
                    , 'zoom': true
                    , 'responsive': true
                    , 'animateType': $.fn.isystkSlider.ANIMATE_TYPE.SLIDE
                    , 'carousel': true
                    , 'slideCallBack': function ({obj, pageNo}) {
                        
                        // 動画が再生済みの場合は、Videoタグを削除して動画サムネイルに戻す
                        revertImageFromVideo(mainFlame);

                        // 現在表示中のページ番号を切り替える
                        currentPageNo = parseInt(obj.attr('zoom-page-no'));

                        let prevPageNo = currentPageNo -1;
                        if (prevPageNo <= 0) {
                            prevPageNo = maxPageNo
                        }
                        makeChild(prevPageNo);

                        let nextPageNo = currentPageNo +1;
                        if (maxPageNo < nextPageNo) {
                            nextPageNo = 1
                        }
                        makeChild(nextPageNo);

                        // キャプションを変更する
                        changeInfo(currentPageNo);
                    }
                });

                // 子要素をタップ時にキャプションの表示/非表示を切り替える。
                let showPartsArea = true;
                slider.click(function (e) {
                    const partsArea = mainFlame.find('.photo_enlarge_partsArea');
                    const timer = setTimeout(function () {
                        clearInterval(timer);
                        if (showPartsArea) {
                            partsArea.hide();
                            showPartsArea = false;
                        } else {
                            partsArea.show();
                            showPartsArea = true;
                        }
                    }, 200);
                });

                // 対象画像クリック時に拡大写真パネルを表示する
                screen.find(targetClass).each(function () {
                    let target = $(this);

                    if (target.hasClass('js-movie')) {
                        target = target.next();
                    }

                    target.css('cursor', 'pointer');
                    target.bind('click', function (e) {
                        e.preventDefault();
                        const pageNo = $(this).closest('.child').attr('page-no');

                        // ページが存在しない場合は追加
                        makeChild(pageNo, function (page) {

                            // スライダーの表示位置を該当ページに切り替える
                            mainFlame.slider.changePage(page.attr('page-no'));

                            // キャプションを変更する
                            changeInfo(pageNo);
                        });
                    });

                    // オーバーレイの設定
                    target
                        .attr('data-panel', '#' + mainFlame.attr('id'))
                        .isystkOverlay({
                            closeCallback: () => {
                                // 動画が再生済みの場合は、Videoタグを削除して動画サムネイルに戻す
                                revertImageFromVideo(mainFlame);
                            }
                        });
                });

                // 拡大写真パネルスライダー 前ページクリック時
                mainFlame.find('.js-prevBtn').click(function (e) {
                    e.preventDefault();
                    mainFlame.slider.prevPage();
                });

                // 拡大写真パネルスライダー 次ページクリック時
                mainFlame.find('.js-nextBtn').click(function (e) {
                    e.preventDefault();
                    mainFlame.slider.nextPage();
                });
            };

            // 補足情報を変更します
            const changeInfo = (pageNo) => {
                const targetItem = targetItems[pageNo - 1];
                const caption = targetItem.caption || '',
                    commentArea = mainFlame.find('.commentArea') || '',
                    captionArea = commentArea.find('.comment .captionArea') || '';

                // キャプション
                captionArea
                    .empty()
                    .text(caption);

                // ページ番号
                mainFlame.find('.commentArea .count').text(`${pageNo}/${targets.length}`);

                // 補足情報を表示する
                mainFlame.find('.photo_enlarge_partsArea').show();
            };

            // 上下左右に余白を追加する。
            const appendMargin = (photo) => {
                const oheight = parseInt(photo.attr('oheight')) || 0,
                    owidth = parseInt(photo.attr('owidth')) || 0,
                    moviePath = photo.data('moviepath') || '',
                    isMovie = (moviePath !== '') ? true : false;

                // 閉じるボタン領域の高さを除いた画面の高さ
                const panelHeight = $(window).height() -40;
                
                if (!isMovie) {
                    // 画像
                    const oheight = photo.attr('oheight') || 0,
                        owidth = photo.attr('owidth') || 0;
                    
                    if (0 < photo.next('video').length) {
                        // 動画が再生済みの場合
                        photo = photo.next();
                    }

                    const x = Math.floor(oheight * $(window).width() / owidth);
                    const margin = Math.floor(($(window).height() - x) / 2);

                    if (0 <= margin) {
                        photo
                            .css('height', '')
                            .css('width', '100%')
                        ;
                    } else {
                        photo
                            .css('height', '100%')
                            .css('width', '')
                            .css('margin', 'auto');
                    }
                    photo.closest('.childKey').css('padding-top', '');

                    const y = Math.floor(oheight * $(window).width() / owidth);
                    const padding = Math.floor(($(window).height() - y) / 2) || 0;
                    if (0 < padding) {
                        photo.closest('.childKey').css('padding-top', padding + 'px');
                    } else {
                        photo.closest('.childKey').css('padding-top', '0px');
                    }
                } else {
                    const self = photo.next(),
                        isMovieBox = self.hasClass('movieBox');

                    if (isMovieBox) {
                        // 動画サムネイル

                        if (!self.is(':visible')) {
                            return;
                        }

                        photo.closest('.childKey').css('margin-top', '');

                        self.css('margin-left', '');

                        const x = Math.floor(oheight * $(window).width() / owidth);
                        const margin = Math.floor((panelHeight - x) / 2) || 0;
                        if (0 <= margin) {
                            self.css('width', '100%');
                            self.find('img').css('width', '100%');
                            const height = Math.floor(self.width() * oheight / owidth);
                            self.css('height', height + 'px');
                            self.find('img').css('height', height + 'px');
                        } else {
                            self.css('height', '100%');
                            self.find('img').css('height', '100%');
                            const width = Math.floor(self.height() * owidth / oheight);
                            self.css('width', width + 'px');
                            self.find('img').css('width', width + 'px');
                        }
                        $.fn.isystkMovie.setPartsPosition(self, self.width(), self.height());

                        if (0 < margin) {
                            photo.closest('.childKey').css('margin-top', margin + 'px');
                        } else {
                            const marginLeft = Math.floor(($(window).width() - self.width()) / 2);
                            if (0 <= marginLeft) {
                                self.css('margin-left', marginLeft + 'px');
                            }
                        }

                    } else {
                        // 動画

                        photo.closest('.childKey').css('margin-top', '');

                        const x = Math.floor(oheight * $(window).width() / owidth);
                        const margin = Math.floor((panelHeight - x) / 2) || 0;
                        if (0 <= margin) {
                            self.css('width', '100%');
                            const height = Math.floor($(window).width() * oheight / owidth);
                            self.css('height', height + 'px');
                        } else {
                            self.css('height', '100%');
                            const width = Math.floor(panelHeight * owidth / oheight);
                            self.css('width', width + 'px');
                        }

                        if (0 < margin) {
                            photo.closest('.childKey').css('margin-top', margin + 'px');
                        } else {
                            photo.closest('.childKey').css('margin-top', '0px');
                        }
                    }
                }
            };
            
			// 再生済みのVideoを動画サムネイルに戻します。
			const revertImageFromVideo = function (mainFlame) {
				mainFlame.slider.find('.childKey video').each(function() {
					const targetVideo = $(this),
						target = targetVideo.closest('.childKey'),
						photo = targetVideo.prev('img');
					if (0 < targetVideo.length) {
						// 動画が再生済みの場合は、Videoタグを削除して動画サムネイルに戻す
						targetVideo.remove();
						photo.show();
						photo.removeClass('movie-end');
						photo.css('margin-top', '');
                        // 画像を動画再生用サムネイルに変換
                        changeMovieBox(photo);
					}
				});
			};
            
            // 画像を動画再生用サムネイルに変換
            const changeMovieBox = (target) => {
                target.addClass('play');
                target.isystkMovie({
                    // 動画再生時
                    clickCallback: function (obj) {
                        // 余白の調整
                        appendMargin(target);

                        // 動画再生時にキャプションパネルを非表示にする。
                        mainFlame.find('.photo_enlarge_partsArea').hide();
                    },
                    // 動画停止時
                    pauseCallback: function () {
                        // 動画停止時にキャプションエリアを再表示する
                        mainFlame.find('.photo_enlarge_partsArea').show();
                    }
                });
            }

            // メインフレームを生成
            const mainFlame = makeFlame();

            // イベントの設定
            bindEvents(mainFlame);
        };

        // 処理開始
        $(this).each(function () {
            init(this);
        });

        return this;
    };

    // デフォルト値
    $.fn.zoomSlider.defaults = {
        'targetClass': 'img' // 拡大する画像要素
        , 'slideCallBack': null // スライド後に処理を行うコールバック(本プラグインで想定していない処理はここでカスタマイズする)
        , 'openCallBack': null // 拡大表示後のコールバック
    };

})(jQuery);

