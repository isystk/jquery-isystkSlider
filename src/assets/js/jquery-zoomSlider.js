(function($){
    /*
     * zoomSlider
     *
     * Copyright (c) 2024 iseyoshitaka 
     *
     * Sample:
     * $('.js-zoomSlider').zoomSlider({}, function() {});
     */

    $.fn.zoomSlider = function(options) {

        const params = $.extend({}, $.fn.zoomSlider.defaults, options);

        const className = "zoomSlider";

        // 初期設定
        const init = (obj) => {

            const screen = $(obj),
                targetClass = params.targetClass,
                target = screen.find(targetClass),
                slideCallBack = params.slideCallBack,
                maxPageNo = target.length;

            let nowLoading = true;

            if (target.length === 0) {
                return;
            }

            const gallery = $('.' + className);

            let index = 1;
            if (gallery) {
                index = gallery.length + 1;
            }

            // target を配列に分割する。
            const targetArray = [];
            (function() {
                let len = Math.floor(target.length / params.arrayCnt);
                if ((target.length % params.arrayCnt) !== 0) {
                    len = len + 1;
                }
                for(let i=0; i < len; i++) {
                    const j = i * params.arrayCnt;
                    const p = target.slice(j, j + params.arrayCnt);
                    targetArray.push(p);
                }
            })();


            // メインフレームを生成します。
            const makeFlame =  (index) => {

                const mainFlame = $([
                    '<div class="isystk-overlay">',
                        '<a href="#" class="js-close close"></a>',
                        '<div class="wrap">',
                            '<div class="js-slider">',
                                '<div class="view-layer">',
                                    '<ul class="parentKey">',
                                    '</ul>',
                                '</div>',
                                '<div>',
                                    '<p><a href="#" class="next-btn"></a></p>',
                                    '<p><a href="#" class="prev-btn"></a></p>',
                                '</div>',
                            '</div>',
                        '</div>',
                    '</div>'
                ].join(''));

                mainFlame.attr('id', 'zoomSlider'+ index);
                mainFlame.addClass(className);
                mainFlame.width($(window).width());

                $('body').append(mainFlame);

                return mainFlame;
            }

            // 子要素を生成します。
            const makeChild =  (mainFlame, page, callback) => {

                const num = (function findArrayNum(page) {
                    return Math.floor((page-1) / params.arrayCnt);
                })(page);

                const photos = [];

                /* ギャラリーに設定する画像データ配列を生成する */
                for (let i=0, len=mainFlame.targetArray[num].length; i<len; i++) {
                    const target = $(mainFlame.targetArray[num][i]),
                        image = target,
                        imagePath = image.attr('src') || '',
                        caption = image.attr('alt') || '';
                    const data = {
                        imagePath : imagePath,
                        caption : caption
                    };
                    photos.push(data);
                }

                // 拡大写真パネルを生成する
                const li = $(photos.map((data) => {
                    return [
                        '<li class="childKey">',
                        '<img src="'+data.imagePath+'" alt="'+data.caption+'" />',
                        '</li>'].join('');
                }).join(''));
                li.attr('array', num);
                li.each(function(i) {
                    $(this).attr('pageno', (num*params.arrayCnt) + (i+1));
                    if (i===0) {
                        $(this).addClass('firstArray');
                    }
                    if (i===(li.length-1)) {
                        $(this).addClass('lastArray');
                    }
                });
                li.css('text-align', 'center')
                    .css('margin-top', '0px');

                // 子要素の横幅を端末のwidthに設定
                li.width($(window).width());
                li.height($(window).height());

                var images = li.find('img');
                var photoLength = images.length;
                images.each(function() {
                    var photo = $(this),
                        imagePath = photo.attr('src') || '';
                    var img = $('<img>');
                    img.on('load',function(){

                        photo.attr('owidth', img[0].width);
                        photo.attr('oheight', img[0].height);
                        var x = Math.floor(photo.attr('oheight') * $(window).width() / photo.attr('owidth'));
                        var margin = Math.floor(($(window).height() - x) / 2);
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
                        if (photoLength !== 1) {
                            photoLength--;
                            return;
                        }
                        images.unbind('load');

                        callback(li);
                    });
                    img.attr('src', imagePath);
                });
            }

            // イベントバンドル
            const bundle = (mainFlame) => {

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
                    , 'slideCallBack': function(data) {

                        var obj = $(data.obj),
                            pageNo = parseInt(obj.attr('page-no')),
                            arrayNo = parseInt(obj.attr('array'));

                        // 画像上下の余白を調整する。
                        prepareDisplay(pageNo);

                        // 両端の場合はメインフレームに次の子要素を追加する。
                        (function() {
                            if (obj.hasClass('firstArray')) {
                                let nextPageNo = pageNo - 1;
                                if (nextPageNo < 1) {
                                    nextPageNo = maxPageNo;
                                }
                                if (mainFlame.find('.childKey[page-no="' + nextPageNo + '"]').length === 0) {
                                    makeChild(mainFlame, nextPageNo, function(li) {
                                        var nextArrayNo = parseInt(li.attr('array'));
                                        // LIタグの差し込み位置を算出
                                        var appendPos = findAppendPos(mainFlame, nextArrayNo);
                                        insertChild(mainFlame.find('.childKey.lastArray[array="'+appendPos+'"]'), li);
                                        if (nextArrayNo < arrayNo && obj.hasClass('cloned')) {
                                            mainFlame.slider.refresh(pageNo, maxPageNo, li.length*2);
                                        } else {
                                            mainFlame.slider.refresh(pageNo, maxPageNo, li.length);
                                        }

                                        // 画像上下の余白を調整する。
                                        prepareDisplay(pageNo);

                                        nowLoading = false;
                                    });
                                }
                            }
                            if (obj.hasClass('lastArray')) {
                                var nextPageNo = pageNo + 1;
                                if (maxPageNo < nextPageNo) {
                                    nextPageNo = 1;
                                }
                                if (mainFlame.find('.childKey[page-no="' + nextPageNo + '"]').length === 0) {
                                    makeChild(mainFlame, nextPageNo, function (li) {
                                        var nextArrayNo = parseInt(li.attr('array'));
                                        insertChild(mainFlame.find('.childKey.lastArray[array="'+arrayNo+'"]'), li);
                                        if (arrayNo < nextArrayNo && !obj.hasClass('cloned')) {
                                            mainFlame.slider.refresh(pageNo, maxPageNo, 0);
                                        } else {
                                            mainFlame.slider.refresh(pageNo, maxPageNo, li.length);
                                        }

                                        // 画像上下の余白を調整する。
                                        prepareDisplay(pageNo);

                                        nowLoading = false;
                                    });
                                }
                            }
                        })();

                        nowLoading = false;
                        if (slideCallBack) {
                            slideCallBack(data);
                        }
                    }, 'resizeCallBack': function (data) {

                        var obj = $(data.obj),
                            pageNo = parseInt(obj.attr('page-no'));

                        // 画像上下の余白を調整する。
                        prepareDisplay(pageNo);

                        mainFlame.css('width', $(window).width() + 'px');
                    }
                });

                // 対象画像クリック時に拡大写真パネルを表示する
                screen.find(targetClass).each(function(i) {
                    var target = $(this),
                        pageNo = i+1;

                    target.css('cursor', 'pointer');
                    target.bind('click', function(e) {
                        e.preventDefault();
                        if (nowLoading) {
                            return;
                        }
                        if (mainFlame.find('.childKey[page-no="' + pageNo + '"]').length === 0) {
                            makeChild(mainFlame, pageNo, function(li) {
                                var arrayNo = parseInt(li.attr('array'));
                                // LIタグの差し込み位置を算出
                                var appendPos = findAppendPos(mainFlame, arrayNo);
                                insertChild(mainFlame.find('.childKey.lastArray[array="'+appendPos+'"]'), li);
                                mainFlame.slider.refresh(null, maxPageNo, li.length);
                                showPage(pageNo);
                            });
                        } else {
                            showPage(pageNo);
                        }
                    });
                });

                // 拡大写真パネルスライダー 前ページクリック時
                mainFlame.find('.js-prevBtn').click(function(e) {
                    e.preventDefault();
                    if (nowLoading) {
                        return;
                    }
                    nowLoading = true;
                    mainFlame.slider.backPage();
                });

                // 拡大写真パネルスライダー 次ページクリック時
                mainFlame.find('.js-nextBtn').click(function(e) {
                    e.preventDefault();
                    if (nowLoading) {
                        return;
                    }
                    nowLoading = true;
                    mainFlame.slider.nextPage();
                });

            };

            // 画面表示を調整する。
            const prepareDisplay = (pageNo) => {
                mainFlame.slider.find('.childKey[page-no="' +pageNo+'"]').each(function() {
                    // 余白の調整
                    appendMargin();
                });
            }

            // 上下左右に余白を追加する。
            const appendMargin = () => {
                // 画面上下にマージン設定（画像）
                mainFlame.slider.find('.childKey img').each(function() {
                    var photo = $(this),
                        oheight = photo.attr('oheight') || 0,
                        owidth = photo.attr('owidth') || 0;

                    photo.closest('.childKey').css('padding-top', '');

                    var x = Math.floor(oheight * $(window).width() / owidth);
                    var padding = Math.floor(($(window).height() - x) / 2) || 0;
                    if (0 < padding) {
                        photo.closest('.childKey').css('padding-top', padding + 'px');
                    } else {
                        photo.closest('.childKey').css('padding-top', '0px');
                    }

                });
            };

            // 次のDOMを追加する位置を算出します。
            const findAppendPos = (mainFlame, n) => {
                if(mainFlame.find('.childKey').length === 0) {
                    return null;
                }
                n = n -1;
                if (n < 0) {
                    n = mainFlame.targetArray.length -1;
                }
                if(mainFlame.find('.childKey[array="'+n+'"]').length === 0) {
                    return findAppendPos(mainFlame, n);
                }
                return n;
            };

            // beforeDom の後に afterDom を追加します。
            const insertChild = (beforeDom, afterDom) => {
                beforeDom.each(function() {
                    var s = $(this);
                    var p = afterDom.clone(true);
                    if (s.hasClass('cloned')) {
                        p.addClass('cloned');
                    }
                    $(s).after(p);
                });
            };

            // 指定したページを表示します。
            const showPage = (pageNo = 1) => {

                if (nowLoading) {
                    return;
                }

                // 初期表示時のスクロール位置を保持しておく。
                defaultScrollTop = $(window).scrollTop();

                mainFlame.slider.changePage(pageNo);

            };

            const mainFlame = makeFlame(index);
            mainFlame.targetArray = targetArray;
            makeChild(mainFlame, 1, function(childFlame) {
                mainFlame.find('.parentKey').append(childFlame);
                bundle(mainFlame);
                nowLoading = false;
            });

            // オーバーレイのクリックイベントを設定
            target.each(function() {
                $(this).attr('data-panel', '#' + mainFlame.attr('id'));
            });
            target.isystkOverlay();

        };

        // 処理開始
        $(this).each(function() {
            init(this);
        });

        return this;
    };

    // デフォルト値
    $.fn.zoomSlider.defaults = {
        'targetClass': 'img' // 拡大する画像要素
        , 'slideCallBack': null // スライド後に処理を行うコールバック(本プラグインで想定していない処理はここでカスタマイズする)
        , 'openCallBack': null // 拡大表示後のコールバック
        , 'arrayCnt': 3 // 初期表示でロードする拡大画像内要素の数
    };

})(jQuery);

