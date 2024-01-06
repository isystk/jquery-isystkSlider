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
                targetClass = params.targetClass;
            
            const targets = screen
                .find(targetClass)
                .filter(function () {
                    // 動画の場合は加工後のDomを除外する
                    return !$(this).hasClass('js-movie')
                });

            let nowLoading = true;

            if (targets.length === 0) {
                // 拡大対象が１つもない場合は何もしない。
                return;
            }

            /* ギャラリーに設定する画像データ配列を生成する */
            const targetItems = $.makeArray(targets
                .map(function() {
                    let self = $(this);
                    if (self.hasClass('movieBox')) {
                        self = self.find('img')
                    }
                    const imagePath = self.attr('src') || '';
                    const caption = self.attr('alt') || '';
                    return {
                        imagePath,
                        caption
                    }
                })
            );

            // メインフレームを生成します。
            const makeFlame =  () => {
                
                const mainFlame = $([
                    '<div class="isystk-overlay">',
                        '<a href="#" class="js-close close"></a>',
                        '<div class="js-slider" style="overflow:hidden;margin 0 auto;background-color: #000;">',
							'<ul class="parentKey photo_enlarge_imageArea">',
							'</ul>',
						'</div>',
                        '<div class="photo_enlarge_partsArea">',
                            '<div class="transitionArea transitionList">',
                                '<p class="item prev js-backBtn" style="position: absolute; top: 52%; left: 5px; margin-top: -20px;">' +
                                    '<a href="#"><img src="./assets/images/btn-prev.svg" alt="前へ" /></a>' +
                                '</p>',
                                '<p class="item next js-nextBtn" style="position: absolute; top: 52%; right: 5px; margin-top: -20px;">' +
                                    '<a href="#"><img src="./assets/images/btn-next.svg" alt="次へ" /></a>' +
                                '</p>',
                            '</div>',
                            '<div class="commentArea" style="position: fixed;height: 29%;background: #000;opacity: 0.8;color:#fff;z-index: 10002;box-sizing: border-box;bottom: 0;width: 100%;padding: 10px;">',
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
                mainFlame.attr('id', 'zoomSlider'+ index);
                mainFlame.addClass(className);
                mainFlame.width($(window).width());

                $('body').append(mainFlame);

                return mainFlame;
            }

            // 子要素を生成します。
            const makeChild =  (callback) => {

                // 拡大写真パネルを生成する
                const li = $(targetItems.map((data) => {
                    return [
                        '<li class="childKey">',
                            '<img src="'+data.imagePath+'" alt="'+data.caption+'" />',
                        '</li>'].join('');
                }).join(''));
                li.css('text-align', 'center')
                    .css('margin-top', '0px');

                // 子要素の横幅を端末のwidthに設定
                li.width($(window).width());
                li.height($(window).height());

                const images = li.find('img');
                let photoLength = images.length;
                images.each(function() {
                    const photo = $(this),
                        imagePath = photo.attr('src') || '';
                    const img = $('<img>');
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
                    , 'slideCallBack': function({obj, pageNo}) {
                        // キャプションを変更する
                        changeCaption(pageNo);
                        nowLoading = false;
                    }, 'resizeCallBack': function (data) {
                        mainFlame.css('width', $(window).width() + 'px');
                    }
                });

                // 子要素をタップ時にキャプションの表示/非表示を切り替える。
                let showPartsArea = true;
                slider.click(function(e) {
                    const partsArea = mainFlame.find('.photo_enlarge_partsArea');
                    const timer = setTimeout(function() {
                        clearInterval(timer);
                        if (showPartsArea) {
                            partsArea.hide();
                            showPartsArea = false;
                        } else {
                            partsArea.show();
                            showPartsArea = true;
                        }
                    } , 200);
                });
                
                // 対象画像クリック時に拡大写真パネルを表示する
                targets.css('cursor', 'pointer');
                targets.each(function(i) {
                    const target = $(this),
                        pageNo = i+1;

                    target.bind('click', function(e) {
                        e.preventDefault();
                        if (nowLoading) {
                            return;
                        }
                        showPage(pageNo);
                    });
                });

                // 拡大写真パネルスライダー 前ページクリック時
                mainFlame.find('.js-prevBtn').click(function(e) {
                    e.preventDefault();
                    if (nowLoading) {
                        return;
                    }
                    nowLoading = true;
                    mainFlame.slider.prevPage();
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

            // 指定したページを表示します。
            const showPage = (pageNo = 1) => {
                if (nowLoading) {
                    return;
                }
                mainFlame.slider.changePage(pageNo);
                // キャプションを変更する
                changeCaption(pageNo);  
            };
            
            // キャプションを変更します
            const changeCaption = (pageNo) => {
                const targetItem = targetItems[pageNo-1];
                const caption = targetItem.caption || '',
                    commentArea = mainFlame.find('.commentArea') || '',
                    captionArea = commentArea.find('.comment .captionArea') || '';

                // キャプション
                captionArea
                    .empty()
                    .text(caption);

                mainFlame.find('.commentArea .count').text(`${pageNo}/${targets.length}`);

                // テキストを表示する
                mainFlame.find('.photo_enlarge_partsArea').show();
            };

            // 上下左右に余白を追加する。
            const appendMargin = (childFlame) => {
                // 画面上下にマージン設定（画像）
                childFlame.each(function() {
                    const photo = $(this).find('img'),
                        oheight = photo.attr('oheight') || 0,
                        owidth = photo.attr('owidth') || 0;

                    photo.closest('.childKey').css('padding-top', '');

                    const x = Math.floor(oheight * $(window).width() / owidth);
                    const padding = Math.floor(($(window).height() - x) / 2) || 0;
                    if (0 < padding) {
                        photo.closest('.childKey').css('padding-top', padding + 'px');
                    } else {
                        photo.closest('.childKey').css('padding-top', '0px');
                    }
                });
            };

            const mainFlame = makeFlame();
            makeChild(function(childFlame) {
                mainFlame.find('.parentKey').append(childFlame);

                // 余白の調整
                appendMargin(childFlame);
                
                bindEvents(mainFlame);
                nowLoading = false;
            });

            // オーバーレイの設定
            targets
                .each(function() {
                    // 対象をクリックした際に表示する拡大パネルを指定する
                    $(this).attr('data-panel', '#' + mainFlame.attr('id'));
                })
                .isystkOverlay();

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

