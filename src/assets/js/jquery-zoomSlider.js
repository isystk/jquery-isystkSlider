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

            let screen = $(obj),
                targetClass = params.targetClass,
                vertical = params.vertical,
                carousel = params.carousel,
                color = params.color;

            const targets = screen
                .find(targetClass)
                .filter(function () {
                    if ($(this).closest('.child').hasClass('cloned')) {
                        // カルーセルありの場合はクローンされたDOMを除外する
                        return false
                    }
                    return true
                });

            if (targets.length === 0) {
                // 拡大対象が１つもない場合は何もしない。
                return;
            }

            // 対象にページ番号を付与する
            targets.each(function (i) {
                $(this).attr('page-no', i + 1)
            })

            const maxPageNo = targets.length
            let currentPageNo = 1;

            /* 対象の画像データを配列に保持する */
            const targetItems = $.makeArray(targets
                .map(function () {
                    let self = $(this);
                    let imagePath = self.attr('src') || '';
                    // オリジナルの画像パスに変更
                    if (imagePath) {
                        imagePath = imagePath
                            .replace(/_sd/g, '');
                    }
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

                let backGroundColor = '#000';
                let fontColor = '#fff';
                let closeBtnClass = 'close';
                if (color === 'white') {
                    backGroundColor = '#fff';
                    fontColor = '#000';
                    closeBtnClass = 'close black';
                }
                const mainFlame = $([
                    '<div class="isystk-overlay zoomPhotoPanel" style="position: fixed;">',
                    '<a href="#" class="js-close ' + closeBtnClass + '"></a>',
                    '<div class="js-slider" style="height: 100%;margin 0 auto;background-color: ' + backGroundColor + ';">',
                    '<ul class="parentKey photo_enlarge_imageArea">',
                    '</ul>',
                    '</div>',
                    '<div class="transport_partsArea" style="display: none">',
                    '<div style="width: 100%;position: absolute;top: 40%;text-align:center;">',
                    '<a href="#" class="continue-btn" style="padding: 7px;display: block;width: 200px;margin: 50px' +
                    ' auto 20px;text-decoration: none; background-color: #fff;">続きを見る</a>',
                    '<a href="#" class="replay-btn" style="padding: 7px;display: block;width: 200px;margin: 50px auto' +
                    ' 20px;text-decoration: none; background-color: #fff;">もう一度見る</a>',
                    '</div>',
                    '</div>',
                    '<div class="photo_enlarge_partsArea">',
                    '<div class="transitionArea transitionList">',
                    '<p class="item prev js-prevBtn" style="position: absolute; top: 50%; left: 5px;' +
                    ' margin-top: -20px;">' +
                    '<a href="#"></a>' +
                    '</p>',
                    '<p class="item next js-nextBtn" style="position: absolute; top: 50%; right: 5px; margin-top: -20px;">' +
                    '<a href="#"></a>' +
                    '</p>',
                    '</div>',
                    '<div class="commentArea" style="position: absolute;height: 29%;background: ' + backGroundColor + ';opacity:' +
                    ' 0.8;color:' + fontColor + ';z-index: 10002;box-sizing: border-box;bottom: 0;width: 100%;padding:' +
                    ' 10px;">',
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

                // 拡大パネル自体のスワイプによる拡大・縮小処理を殺す
                mainFlame[0].addEventListener('touchmove', function (e) {
                    e.preventDefault();
                });

                $('body').append(mainFlame);

                $(window).resize(function () {
                    const children = mainFlame.find('.childKey');
                    children.each(function () {
                        let photo = $(this).find('img')
                        // 余白の調整
                        appendMargin(photo);
                    });
                });
                
                return mainFlame;
            }

            // 子要素を生成します。
            const makeChild = (pageNo, callback) => {
                pageNo = parseInt(pageNo);

                let page = mainFlame.find('.childKey[zoom-page-no="' + pageNo + '"]').filter(function () {
                    return !$(this).hasClass('cloned')
                });
                if (0 < page.length) {
                    if (callback) {
                        callback(page)
                    }
                    return
                }
                const data = targetItems[pageNo - 1]
                const li = $([
                    '<li class="childKey" zoom-page-no="' + pageNo + '" style="display: flex;justify-content: center;align-items: center;">',
                    '<img src="' + data.imagePath + '" alt="' + data.caption + '" class="' + (data.isMovie ? 'js-movie' : '') + '" />',
                    '</li>'
                ].join(''));

                // 子要素の横幅を端末のwidthに設定
                li.css('width', '100vw');
                li.css('height', '100vh');

                const index = findAppendPos(pageNo)

                // スライダーの指定位置に生成した子要素を追加
                mainFlame.slider.appendChild(li, index);

                const photo = li.find('img'),
                    imagePath = photo.attr('src') || '';

                const img = $('<img>');
                img.on('load', function () {

                    const children = mainFlame.find('.childKey[zoom-page-no="' + pageNo + '"]');
                    children.each(function () {
                        const photo = $(this).find('img')
                        photo.attr('owidth', img[0].width);
                        photo.attr('oheight', img[0].height);

                        // 余白の調整
                        appendMargin(photo);

                        if (photo.hasClass('js-movie')) {
                            // 画像を動画再生用サムネイルに変換
                            changeMovieBox(photo);
                        }

                    })

                    img.unbind('load');

                    if (callback) {
                        callback(children)
                    }
                });
                img.attr('src', imagePath);
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
                    if ($(this).attr("zoom-page-no") === pageNo + "") {
                        index = i;
                        return
                    }
                });
                if (index < 0) {
                    pageNo = pageNo - 1;
                    if (pageNo === 0) {
                        return 0;
                    }
                    return findAppendPos(pageNo)
                }
                return index + 1;
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
                    , 'vertical': vertical
                    , 'responsive': true
                    , 'animateType': $.fn.isystkSlider.ANIMATE_TYPE.SLIDE
                    , 'carousel': carousel
                    , 'slideCallBack': function ({obj, pageNo}) {

                        // 現在表示中のページ番号を切り替える
                        const zoomPageNo = parseInt(obj.attr('zoom-page-no'));
                        if (currentPageNo !== zoomPageNo) {
                            // 動画が再生済みの場合は、Videoタグを削除して動画サムネイルに戻す
                            revertImageFromVideo(mainFlame);

                            // 補足情報を表示する
                            mainFlame.find('.photo_enlarge_partsArea').show();
                        }
                        currentPageNo = zoomPageNo;
                        
                        let prevPageNo = currentPageNo - 1;
                        if (prevPageNo <= 0) {
                            prevPageNo = maxPageNo
                        }
                        makeChild(prevPageNo);

                        let nextPageNo = currentPageNo + 1;
                        if (maxPageNo < nextPageNo) {
                            nextPageNo = 1
                        }
                        makeChild(nextPageNo);

                        // キャプションを変更する
                        changeInfo(currentPageNo);
                    }
                });

                // 対象画像クリック時に拡大写真パネルを表示する
                screen.find(targetClass).each(function (i) {
                    let target = $(this);
                    if (target.hasClass('js-movie')) {
                        target = target.next();
                    }

                    target.css('cursor', 'pointer');
                    target.bind('click', function (e) {
                        e.preventDefault();
                        const pageNo = $(this).closest('.child').attr('page-no');

                        // ページが存在しない場合は追加
                        makeChild(pageNo, function (li) {

                            const slidePageNo = parseInt(li.attr('page-no'));
                            // スライダーの表示位置を該当ページに切り替える
                            mainFlame.slider.changePage(slidePageNo);

                            // キャプションを変更する
                            changeInfo(pageNo);

                            mainFlame.css('visibility', 'visible')

                            if (params.moviePlay) {
                                // 動画を自動再生する
                                setTimeout(function () {
                                    mainFlame.slider.find('.childKey[page-no="' + pageNo + '"]').find('.movieBox ').trigger('click');
                                }, 500);
                            }

                        });
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

                // 拡大写真パネル 閉じるボタンクリック時
                mainFlame.find('.js-close').click(function (e) {
                    e.preventDefault();

                    // 動画が再生済みの場合は、Videoタグを削除して動画サムネイルに戻す
                    revertImageFromVideo(mainFlame);

                    mainFlame.css('visibility', 'hidden')
                });

                // 導線エリア内の「続きを見る」ボタン制御
                mainFlame.find('.transport_partsArea .continue-btn').click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    mainFlame.find('.transport_partsArea').hide();
                    mainFlame.find('.photo_enlarge_partsArea').hide();
                    const video = mainFlame.slider.find('.childKey[zoom-page-no="' + currentPageNo + '"]').find('video');
                    $.fn.isystkMovie.playVideo(video);
                });

                // 導線エリア内の「もう一度見る」ボタン制御
                mainFlame.find('.transport_partsArea .replay-btn').click(function (e) {
                    e.preventDefault();
                    // Videoタグを削除して動画サムネイルに戻す
                    revertImageFromVideo(mainFlame);
                    setTimeout(function () {
                        mainFlame.slider.find('.childKey[zoom-page-no="' + currentPageNo + '"]').find('.movieBox ').trigger('click');
                    }, 300);
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

            };

            // 上下左右に余白を追加する。
            const appendMargin = (photo) => {
                if (photo.next().is("video")) {
                    const video = photo.next();
                    video.css('width', photo.width());
                    video.css('height', photo.height());
                }
            };

            // 再生済みのVideoを動画サムネイルに戻します。
            const revertImageFromVideo = function (mainFlame) {
                mainFlame.slider.find('.childKey video').each(function () {
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
                setTimeout(function () {
                    // 動画停止時に詳細画面への導線エリアを非表示する
                    mainFlame.find('.transport_partsArea').hide();
                }, 100)
            };

            // 画像を動画再生用サムネイルに変換
            const changeMovieBox = (target) => {
                target.addClass('play');
                target.isystkMovie({
                    callbackfunc: function () {
                        // 余白の調整
                        appendMargin(target);
                    },
                    // 動画サムネイルクリック時
                    clickCallback: function (obj) {
                        // 余白の調整
                        appendMargin(target);
                        // 動画再生時にキャプションパネルを非表示にする。
                        mainFlame.find('.photo_enlarge_partsArea').hide();
                    },
                    // 動画再生時
                    playCallback: function () {
                        // 動画停止時に詳細画面への導線エリアを非表示にする。
                        mainFlame.find('.transport_partsArea').hide();
                        // 動画再生時にキャプションパネルを非表示にする。
                        mainFlame.find('.photo_enlarge_partsArea').hide();
                    },
                    // 動画停止時
                    pauseCallback: function () {
                        // 動画停止時に詳細画面への導線エリアを表示する
                        mainFlame.find('.transport_partsArea').show();
                        // 「続きを見る」ボタンを表示する
                        mainFlame.find('.continue-btn').show();
                        // 「もう一度見る」ボタンを非表示にする
                        mainFlame.find('.replay-btn').hide();
                        // 動画停止時にキャプションエリアを再表示する
                        mainFlame.find('.photo_enlarge_partsArea').show();
                    },
                    // 動画再生終了時
                    endedCallback: function () {
                        // 動画停止時に詳細画面への導線エリアを表示する
                        mainFlame.find('.transport_partsArea').show();
                        // 「続きを見る」ボタンを非表示にする
                        mainFlame.find('.continue-btn').hide();
                        // 「もう一度見る」ボタンを表示する
                        mainFlame.find('.replay-btn').show();
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
        targetClass: 'img' // 拡大する画像要素
        , slideCallBack: null // スライド後に処理を行うコールバック(本プラグインで想定していない処理はここでカスタマイズする)
        , openCallBack: null // 拡大表示後のコールバック
        , vertical: false // 縦方向にスライドさせるかどうか
        , moviePlay: true // 表示すると同時に動画を再生するかどうか
        , carousel: true // １ページ目または、最終ページに到達した場合に、ローテートさせるかどうか
        , color: 'black' // テーマカラー（black or white）
    };

})(jQuery);

