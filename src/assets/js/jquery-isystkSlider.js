(function ($) {
    /*
     * 画像スライダー
     * 
     * Copyright (c) 2024 iseyoshitaka
     */
    $.fn.isystkSlider = function (options) {

        let screen = null // 処理対象エリア
            , ul = null // 親要素
            , li = null // 子要素
            , back = null // 前ページボタン
            , next = null // 次ページボタン
            , pos = 0 // 子要素のインデックス
            , pageNo = 1 // 現在のページ番号
            , maxPageNo = 1 // 最大のページ番号
            , liwidth = 0 // 子要素１つの横幅
            , nowLoading = false // 処理中かどうか
            , dragw = 0 // スワイプした横幅
            , childKey = null
            , shift = null
            , shiftw = 0
            , vertical = false
            , animateType = null
            , slideSpeed = null
            , carousel = null
            , slideCallBackFunc = null
            , isAutoSlide = null
            , autoSlideInterval = null
            , hoverPause = null
            , responsive = null
            , swipe = null
            , zoom = null;

        const params = $.extend({}, $.fn.isystkSlider.defaults, options);

        // jQueryオブジェクトキャッシュ、初期設定を行う
        const init = function (obj) {
            screen = $(obj);
            ul = screen.find(params.parentKey);
            back = screen.find(params.prevBtnKey);
            next = screen.find(params.nextBtnKey);
            childKey = params.childKey;
            animateType = params.animateType;
            isAutoSlide = params.autoSlide;
            autoSlideInterval = params.autoSlideInterval;
            hoverPause = params.hoverPause;
            responsive = params.responsive;
            swipe = params.swipe;
            zoom = params.zoom;
            slideSpeed = params.slideSpeed;
            shift = params.shift;
            vertical = params.vertical;
            carousel = params.carousel;
            slideCallBackFunc = params.slideCallBack;

            if (screen.hasClass('slider-set-end')) {
                // 既にスライダー設定済みの場合は何もしない
                return;
            }

            if (carousel) {
                pos = shift;
            }

            // 表示要素をリセットする
            reset();

            // 各種イベントの設定
            bindEvent();

            // スライダーを設定したよっていうマークを付ける。
            screen.addClass('slider-set-end');
        };

        // 各種イベントの設定
        const bindEvent = function () {

            // スワイプでのページングを可能にする
            if (swipe) {
                swipeEvent();
            }

            // ボタンクリックでのページングを可能にする
            pagingEvent();

            // 自動でのページングを可能にする
            if (isAutoSlide) {
                autoSlide.init();
            }

        }

        // 指定したページに移動する
        const slide = function (move, animateType = ANIMATE_TYPE.NO) {

            if (zoom) {
                // ピンチアウト中の場合はリセットする。
                zoomImage.resetImage();
                // ピンチアウトによる画像の拡大・縮小を可能にする。
                zoomImage.init();
            }

            // if (maxPageNo <= 1) {
            //     // 子要素が１つの場合は何もしない
            //     nowLoading = false;
            //     dragw = 0;
            //     return;
            // }

            if (!carousel) {
                // カルーセルでない場合
                if ((move < 0 && pageNo === 1) || (0 < move && pageNo === maxPageNo)) {
                    // 次ページが存在しない場合は何もしない
                    nowLoading = false;
                    dragw = 0;
                    return;
                }
            }

            // 現在のオフセット位置と移動後のオフセット位置を設定
            let from = -1 * (pos / shift) * shiftw - dragw;
            const to = from - (shiftw * move) + dragw;

            // if (from === to) {
            //     // 移動が先が同じ位置の場合は何もしない
            //     nowLoading = false;
            //     dragw = 0;
            //     return;
            // }

            nowLoading = true;

            // 移動後の子要素のインデックスを設定
            pos = pos + (shift * move);

            // ページ番号を設定
            pageNo = pageNo + move;
            if (pageNo < 1) {
                pageNo = pageNo + maxPageNo;
            } else if (maxPageNo < pageNo) {
                pageNo = pageNo - maxPageNo;
            }

            // ページングボタンの表示制御
            showArrows();

            const direction = vertical ? 'top' : 'left';

            if (animateType === ANIMATE_TYPE.NO) {
                // アニメーションを利用せずに画像を切り替える。
                if (1 < maxPageNo && carousel) {
                    ul.css(direction, '-' + (pos * liwidth) + 'px');
                } else {
                    ul.css(direction, '-' + ((pos - shift) * liwidth) + 'px');
                }

                // スライド後の後処理
                nowLoading = false;
                dragw = 0;
                slideAfter();
            } else if (animateType === ANIMATE_TYPE.SLIDE) {
                // スライドで画像を切り替える。（Androidで負荷が大きいため、jQueryのアニメーションは利用しない)
                (() => {
                    const elem = ul[0];
                    const begin = +new Date();
                    const duration = slideSpeed;
                    const easing = function (time, duration) {
                        return -(time /= duration) * (time - 2);
                    };
                    const timer = setInterval(function () {
                        const time = new Date() - begin;
                        let _pos, _now;
                        if (time > duration) {
                            clearInterval(timer);
                            _now = to;
                            elem.style[direction] = _now + 'px';

                            // スライド後の後処理
                            nowLoading = false;
                            dragw = 0;
                            slideAfter();
                            return;
                        } else {
                            _pos = easing(time, duration);
                            _now = _pos * (to - from) + from;
                        }
                        elem.style[direction] = _now + 'px';
                    }, 10);
                })();
            } else if (animateType === ANIMATE_TYPE.FADE) {
                // フェードで画像を切り替える。
                ul.animate({'opacity': 0}, 300, function () {
                    if (1 < maxPageNo && carousel) {
                        ul.css(direction, '-' + (pos * liwidth) + 'px').animate({'opacity': 1}, 300);
                    } else {
                        ul.css(direction, '-' + ((pos - shift) * liwidth) + 'px').animate({'opacity': 1}, 300);
                    }
                    // スライド後の後処理
                    nowLoading = false;
                    dragw = 0;
                    slideAfter();
                });
            }

        };

        // ページングボタンの表示制御
        const showArrows = () => {
            if (carousel) {
                // カルーセルが有効な場合は何もしない
                return;
            }
            back.show();
            next.show();

            if (maxPageNo <= 1) {
                // 1ページしかない場合
                next.hide();
                back.hide();
                return;
            }
            // 複数ページある場合

            if (pageNo === 1) {
                // 左端
                back.hide();
            } else if (pageNo === maxPageNo) {
                // 右端
                next.hide();
            }
        };

        // カルーセル用に両端に番兵を作成する
        const initCarousel = () => {

            // 最終ページに空きが出来る場合は空のLIダグを追加する。例）｜○○○｜○○○｜○○○｜○  ｜
            const addSize = li.length % shift;
            if (addSize !== 0) {
                for (let i = 0, len = shift - addSize; i < len; i++) {
                    const clone = ul.find(childKey).filter(':first').clone(true).addClass('cloned').empty();
                    if (vertical) {
                        clone.css('height', li.height()).css('width', '1px')
                    } else {
                        clone.css('width', li.width()).css('height', '1px')
                    }
                    ul.append(clone);
                }
                // liを再キャッシュ
                li = ul.find(childKey);
            }

            const direction = vertical ? 'top' : 'left';
            ul
                .append(li.clone(true).slice(0, shift).addClass('cloned'))
                .prepend(li.clone(true).slice(li.length - (shift), li.length).addClass('cloned'))
                .css(direction, '-' + (liwidth * shift * pageNo) + 'px'); // 左端に追加した番兵の分だけシフトする

            // liを再キャッシュ
            li = ul.find(childKey);
        };

        // カルーセル
        const doCarousel = () => {
            const direction = vertical ? 'top' : 'left';
            if (pos <= 0) {
                // 左端
                pos = li.length - (shift * 2);
                ul.css(direction, '-' + (liwidth * pos) + 'px');
            } else if (li.length - shift <= pos) {
                // 右端
                pos = shift;
                ul.css(direction, '-' + (liwidth * pos) + 'px');
            }
        };

        // ボタンクリックでのページングを可能にする
        const pagingEvent = () => {
            // 左方向へスライドする
            back.click(function (e) {
                e.preventDefault();
                prevPage();
            });

            // 右方向へスライドする
            next.click(function (e) {
                e.preventDefault();
                nextPage();
            });
        };

        // 要素のサイズ調整
        const reset = () => {
            const exec = function () {

                // 既に番兵がある場合はリセット
                ul.find('.cloned').remove()

                li = ul.find(params.childKey);

                li.each(function (i) {
                    $(this).attr('page-no', (i + 1));
                });

                // cssを調整する
                ul.css('position', 'relative');
                if (vertical) {
                    // 縦方向スライドの場合
                    ul.parent().css('overflow-y', 'hidden');
                } else {
                    // 横方向スライドの場合
                    // li.css('float', 'left');
                    ul.css('display', 'flex');
                    ul.parent().css('overflow-x', 'hidden');
                }

                if (vertical) {
                    const margin = Math.floor((li.outerHeight(true) - li.height()) / 2);
                    liwidth = li.height() + margin;
                } else {
                    if (responsive) {
                        // 子要素の横幅を端末のwidthに設定
                        const margin = ul.find(childKey).outerWidth(true) - ul.find(childKey).width();
                        ul.find(childKey).css('min-width', $(window).width() - margin);
                    }
                    liwidth = li.outerWidth(true);
                }

                // スライド幅＝子要素横幅✕１ページに含まれる子要素の数
                shiftw = liwidth * shift;
                // 最大ページ数＝子要素の数÷１ページに含まれる子要素の数
                maxPageNo = Math.ceil(li.length / shift);

                // １ページの場合はスライド不要の為、カルーセルは強制OFFとする。
                // if (maxPageNo <= 1) {
                //     carousel = false;
                //     swipe = false;
                // }

                if (vertical) {
                    // 縦方向スライドの場合
                    ul.css('height', shiftw * li.length / shift);
                    ul.parent().css('height', shiftw);
                } else {
                    // 横方向スライドの場合
                    ul.css('width', shiftw * li.length / shift)
                }

                // ページングボタンの表示制御
                showArrows();

                if (carousel) {
                    initCarousel();
                }

                if (responsive) {
                    // レスポンシブが有効になっている場合

                    // ピンチアウト中の場合はリセットする。
                    if (zoom) {
                        zoomImage.resetImage();
                    }

                    const direction = vertical ? 'top' : 'left';
                    ul.css(direction, '-' + (liwidth * shift * pos) + 'px');
                }

            };

            // 画面が回転された場合
            $(window).on('orientationchange', exec);
            // 画面がリサイズされた場合
            $(window).resize(exec);
            exec();
        }

        // スワイプでのページングを可能にする
        const swipeEvent = () => {
            const isTouch = ('ontouchstart' in window);
            // 慣性を利用するかどうか
            ul.bind({
                // タッチの開始、マウスボタンを押したとき
                'touchstart mousedown': function (e) {
                    if (nowLoading) {
                        event.preventDefault();
                        event.stopPropagation();
                        return;
                    }
                    nowLoading = true;

                    // 自動スライドのタイマーをリセットする。
                    if (autoSlide.on) {
                        autoSlide.restart();
                    }

                    // 開始位置を覚えておく
                    this.pageX = ((isTouch && event.changedTouches) ? event.changedTouches[0].pageX : e.pageX);
                    this.pageY = ((isTouch && event.changedTouches) ? event.changedTouches[0].pageY : e.pageY);
                    this.left = parseInt($(this).css('left'));
                    if (isNaN(this.left)) {
                        this.left = $(this).position().left;
                    }
                    this.top = parseInt($(this).css('top'));
                    if (isNaN(this.top)) {
                        this.top = $(this).position().top;
                    }
                    this.startTop = this.top;
                    this.startLeft = this.left;

                    this.touched = true;

                },
                // タッチしながら移動、マウスのドラッグ
                'touchmove mousemove': function (e) {

                    if (!this.touched) {
                        return;
                    }

                    const x = (this.pageX - ((isTouch && event.changedTouches) ? event.changedTouches[0].pageX : e.pageX));
                    const y = (this.pageY - ((isTouch && event.changedTouches) ? event.changedTouches[0].pageY : e.pageY));

                    if (!vertical) {
                        // 横方向スライドの場合
                        if (Math.abs(x) < 5 || 200 < Math.abs(y)) {
                            // 縦スワイプは画面をスクロールさせたいので制御しない
                            return;
                        }
                    }
                    // スワイプさせる
                    event.preventDefault();
                    event.stopPropagation();

                    if (!carousel) {
                        if (vertical) {
                            // 縦方向スライドの場合

                            // １ページ目は右にスワイプさせない。
                            if (0 < (this.top - y)) {
                                return;
                            }
                            // 最後のページは左にスワイプさせない
                            if ((this.top - y) <= -1 * ((maxPageNo - 1) * shiftw)) {
                                return;
                            }
                        } else {
                            // 横方向スライドの場合

                            // １ページ目は右にスワイプさせない。
                            if (0 < (this.left - x)) {
                                return;
                            }
                            // 最後のページは左にスワイプさせない
                            if ((this.left - x) <= -1 * ((maxPageNo - 1) * shiftw)) {
                                return;
                            }
                        }
                    }

                    // 移動先の位置を取得する
                    if (vertical) {
                        this.top = this.top - y;
                        $(this).css({top: this.top});
                    } else {
                        this.left = this.left - x;
                        $(this).css({left: this.left});
                    }

                    // 位置 X,Y 座標を覚えておく
                    this.pageX = ((isTouch && event.changedTouches) ? event.changedTouches[0].pageX : e.pageX);
                    this.pageY = ((isTouch && event.changedTouches) ? event.changedTouches[0].pageY : e.pageY);

                },
                // タッチの終了、マウスのドラッグの終了
                'touchend mouseup touchcancel': function (e) {
                    if (!this.touched) {
                        return;
                    }
                    this.touched = false;

                    const self = this;

                    const startDirection = vertical ? 'startTop' : 'startLeft';
                    const direction = vertical ? 'top' : 'left';

                    // 残りの移動処理
                    const restMove = function (movew) {
                        // スワイプ中（touchmove mousemove）で移動したページ量
                        let movePage = Math.floor(Math.abs(movew) / shiftw);
                        if (movePage !== 0) {
                            if (movew < 0) {
                                movePage = movePage * -1;
                            }
                            // ページ番号
                            pageNo = pageNo + movePage;
                            if (pageNo < 1) {
                                pageNo = pageNo + maxPageNo;
                            } else if (maxPageNo < pageNo) {
                                pageNo = pageNo - maxPageNo;
                            }
                            pos = pos + (shift * movePage);
                            if (carousel) {
                                // 左端
                                if (pos <= 0) {
                                    pos = (li.length / 2);
                                    ul.css(direction, '-' + (liwidth * pos) + 'px');
                                    pageNo = 1;
                                    slide(0, ANIMATE_TYPE.NO);
                                    return;
                                    // 右端
                                } else if (li.length <= pos) {
                                    const range = pos - li.length;
                                    pos = (li.length / 2) + range;
                                    ul.css(direction, '-' + (liwidth * pos) + 'px');
                                    pageNo = maxPageNo;
                                    slide(0, ANIMATE_TYPE.NO);
                                    return;
                                }
                            }
                        }

                        const reboundw = 50;
                        const restw = Math.abs(movew) % shiftw;
                        if (movew < 0) {
                            // 一定幅以上スワイプしていない場合は、跳ね返り処理を行う。
                            if ((restw < reboundw) || (!carousel && ((pageNo <= 1 && movew < 0) || (maxPageNo <= pageNo && 0 < dragw)))) {
                                const from = self[startDirection] - movew;
                                const to = self[startDirection] - (shiftw * movePage);
                                rebound(from, to);
                            } else {
                                let p = pageNo - 1;
                                if (!carousel && p <= 1) {
                                    p = 1;
                                }
                                // 前ページ
                                dragw = movew - (shiftw * movePage);
                                // 移動するページ量
                                const move = p - pageNo;
                                slide(move, ANIMATE_TYPE.SLIDE);
                            }
                        } else if (0 < movew) {
                            // 一定幅以上スワイプしていない場合は、跳ね返り処理を行う。
                            if ((restw < reboundw) || (!carousel && ((pageNo <= 1 && movew < 0) || (maxPageNo <= pageNo && 0 < dragw)))) {
                                const from = self[startDirection] - movew;
                                const to = self[startDirection] - (shiftw * movePage);
                                rebound(from, to);
                            } else {
                                let p = pageNo + 1;
                                if (!carousel && maxPageNo <= p) {
                                    p = maxPageNo;
                                }
                                // 次ページ
                                dragw = movew - (shiftw * movePage);
                                // 移動するページ量
                                const move = p - pageNo;
                                slide(move, ANIMATE_TYPE.SLIDE);
                            }
                        } else {
                            // 何もしない
                            nowLoading = false;
                        }
                    }

                    // リバウンド処理
                    const rebound = function (from, to) {
                        const elem = ul[0];
                        const begin = +new Date();
                        const duration = slideSpeed;
                        const easing = function (time, duration) {
                            return -(time /= duration) * (time - 2);
                        };
                        const timer = setInterval(function () {
                            const time = new Date() - begin;
                            let _pos, _now;
                            if (time > duration) {
                                clearInterval(timer);
                                _now = to;
                                elem.style[direction] = _now + 'px';

                                slide(0, ANIMATE_TYPE.NO);
                            } else {
                                _pos = easing(time, duration);
                                _now = _pos * (to - from) + from;
                            }
                            elem.style[direction] = _now + 'px';
                        }, 10);
                    }

                    const movew = self[startDirection] - self[direction];
                    restMove(movew);

                }
            });
        };

        // 画像のピンチアウトによる拡大・縮小を可能にする
        const zoomImage = this.zoomImage = new (function () {

            let initZoom = 1;
            let moveX = 0;
            let moveY = 0;
            let zoom = 1;
            let zoomUpRate = 1;
            let zoomDownRate = 1;
            let beforeMoveX = 0;
            let beforeMoveY = 0;
            let beforeZoom = 1;
            let zoomImageLoading = false; // ピンチアウト中どうか
            let zoomImageLeftMax = false; // ピンチアウトにて左端を表示中
            let zoomImageRightMax = false; // ピンチアウトにて右端を表示中

            // ピンチアウトでリサイズした画像を元の状態に戻す。
            const resetImage = this.resetImage = function () {

                ul.find(childKey).each(function () {

                    const target = $(this),
                        img = target.find('img');

                    img.css('position', '');
                    img.css('top', '');
                    img.css('left', '');
                    img.closest(childKey).css('text-align', 'center');

                    img.css({
                        'transform-origin': '',
                        '-webkit-transform-origin': '',
                        '-moz-transform-origin': '',
                        '-ms-transform-origin': ''
                    });
                    img.css({
                        'transition': '',
                        '-webkit-transition': '',
                        '-moz-transition': '',
                        '-ms-transition': ''
                    });
                    img.css({
                        'transform': '',
                        '-webkit-transform': '',
                        '-moz-transform': '',
                        '-ms-transform': ''
                    });

                    img.removeClass('js-zoomImage');

                });

                initZoom = 1;
                moveX = 0;
                moveY = 0;
                zoom = 1;
                zoomUpRate = 1;
                zoomDownRate = 1;
                beforeMoveX = 0;
                beforeMoveY = 0;
                beforeZoom = 1;
                zoomImageLoading = false;
                zoomImageLeftMax = false;
                zoomImageRightMax = false;
            };

            this.init = function () {

                ul.find(childKey).each(function () {

                    let target = $(this),
                        img = target.find('img'),
                        owidth = parseInt(img.attr('owidth'), 10),
                        oheight = parseInt(img.attr('oheight'), 10),
                        pageX1 = 0,
                        pageY1 = 0,
                        pageX2 = 0,
                        pageY2 = 0,
                        initWidth = 0,
                        initHeight = 0;

                    // 動画は対象外
                    if (target.find('.targetMovie').length !== 0) {
                        return;
                    }

                    target.css('overflow', 'hidden');
                    let touchstart_bar = 0;
                    let multiTap = false; // 指2本でタップしているかどうか
                    let doubleTap = false; // ダブルクリックしているかどうか
                    let nowMoving = false;
                    let tapCount = 0;

                    if (!target.hasClass('bind_touchstart')) {
                        target.addClass('bind_touchstart');

                        //タッチの場合
                        target[0].addEventListener('touchstart', function (e) {

                            if (!img.hasClass('js-zoomImage')) {
                                initWidth = img.width();
                                initHeight = img.height();
                            }
                            img.addClass('js-zoomImage');

                            if (e.touches.length === 1) {

                                multiTap = false;
                                ++tapCount;

                                // ダブルタップ判定
                                if (tapCount === 2) {

                                    setTimeout(function () {

                                        if (tapCount !== 2) {
                                            tapCount = 0;
                                            return;
                                        }

                                        doubleTap = true;
                                        // シングルタップ判定
                                        e.preventDefault();

                                        // 開始位置を覚えておく
                                        img.css('position', 'fixed');
                                        img.css('top', (($(window).height() - initHeight) / 2) + 'px');
                                        img.css('left', (($(window).width() - initWidth) / 2) + 'px');
                                        img.closest(childKey).css('text-align', '');

                                        if (1 < zoom) {
                                            moveX = 0;
                                            moveY = 0;
                                            zoom = 1;
                                            zoomImageLoading = false;
                                        } else {
                                            // 縦長かどうか
                                            var isVertical = ($(window).width() < $(window).height());
                                            if (isVertical) {
                                                zoom = $(window).height() / initHeight;
                                            } else {
                                                zoom = $(window).width() / initWidth;
                                            }
                                            zoomImageLoading = true;
                                        }

                                        imageTransform(img, {
                                            initZoom: initZoom,
                                            moveX: moveX,
                                            moveY: moveY,
                                            zoom: zoom
                                        }, true)

                                        if (zoom === 1) {
                                            setTimeout(function () {
                                                img.css('position', '');
                                                img.css('top', '');
                                                img.css('left', '');
                                                img.closest(childKey).css('text-align', 'center');
                                            }, 150);
                                        }

                                        tapCount = 0;
                                    }, 100);

                                } else {
                                    doubleTap = false;
                                    setTimeout(function () {
                                        tapCount = 0;
                                    }, 300);
                                }

                            } else {
                                //2本指だったらピンチアウト処理開始

                                // 開始位置を覚えておく
                                img.css('position', 'fixed');
                                img.css('top', (($(window).height() - initHeight) / 2) + 'px');
                                img.css('left', (($(window).width() - initWidth) / 2) + 'px');
                                img.closest(childKey).css('text-align', '');

                                multiTap = true;
                                zoomImageLoading = true;
                                nowLoading = false;
                                initZoom = zoom;

                                //はじめに2本指タッチした時の面積
                                var w_abs_start = Math.abs(e.touches[1].pageX - e.touches[0].pageX);
                                var h_abs_start = Math.abs(e.touches[1].pageY - e.touches[0].pageY);
                                touchstart_bar = Math.abs(w_abs_start * h_abs_start);

                                // ディスプレイに対して垂直に２本まっすく指をおいた場合はスライド処理をさせる。
                                if (w_abs_start < 10 || h_abs_start < 10) {
                                    multiTap = false;
                                }

                                imageTransform(img, {initZoom: initZoom, moveX: moveX, moveY: moveY, zoom: zoom}, false)

                                var isCenterZoom = true;
                                if (isCenterZoom) {
                                    // 常に画像の中心を軸として拡大・縮小を行う
                                    img.css({
                                        'transform-origin': 50 + '% ' + 50 + '%',
                                        '-webkit-transform-origin': 50 + '% ' + 50 + '%',
                                        '-moz-transform-origin': 50 + '% ' + 50 + '%',
                                        '-ms-transform-origin': 50 + '% ' + 50 + '%'
                                    });
                                } else {
                                    // ピンチアウトした中心を軸として拡大・縮小を行う

                                    // ピンチの中心座標を取得
                                    var tapX = Math.abs(parseInt(e.touches[1].clientX) + parseInt(e.touches[0].clientX)) / 2;
                                    var tapY = Math.abs(parseInt(e.touches[1].clientY) + parseInt(e.touches[0].clientY)) / 2;

                                    // 現在の画像サイズ
                                    var nowWidth = Math.floor(initWidth * zoom);
                                    var nowHeight = Math.floor(initHeight * zoom);

                                    // 現在の画像の中心座標
                                    var imgCenterX = Math.floor(nowWidth / 2) - ((nowWidth - initWidth) / 2);
                                    var imgCenterY = Math.floor(nowHeight / 2) - ((nowHeight - initHeight) / 2) + parseInt($(img).parent().css('margin-top'));
                                    // 画像の中心をタップした際に、以下の２つの座標は常に同じである必要がある。
//										target.find('.debugText').text('tap:' + tapX + 'x' + tapY + '/img:' + imgCenterX + 'x' + imgCenterY);

                                    // 拡大・縮小する際の基準位置を算出
                                    var posPerX = 50 + Math.floor((tapX - imgCenterX) * 100 / nowWidth);
                                    var posPerY = 50 + Math.floor((tapY - imgCenterY) * 100 / nowHeight);

                                    img.css({
                                        'transition': '',
                                        '-webkit-transition': '',
                                        '-moz-transition': '',
                                        '-ms-transition': ''
                                    });
                                    img.css({
                                        'transform-origin': posPerX + '% ' + posPerY + '%',
                                        '-webkit-transform-origin': posPerX + '% ' + posPerY + '%',
                                        '-moz-transform-origin': posPerX + '% ' + posPerY + '%',
                                        '-ms-transform-origin': posPerX + '% ' + posPerY + '%'
                                    });
                                }
                            }

                            pageX1 = e.touches[0].pageX;
                            pageY1 = e.touches[0].pageY;
                            if (multiTap) {
                                pageX2 = e.touches[1].pageX;
                                pageY2 = e.touches[1].pageY;
                            }

                        }, false);
                    }

                    if (!target.hasClass('bind_touchmove')) {
                        target.addClass('bind_touchmove');

                        //ムーブの場合
                        target[0].addEventListener('touchmove', function (e) {

                            if (!zoomImageLoading) {
                                return;
                            }

                            if (!multiTap) {

                                //1本指だったら移動
                                var x = (pageX1 - e.touches[0].pageX);
                                var y = (pageY1 - e.touches[0].pageY);

                                // 現在の画像サイズ
                                var nowWidth = Math.floor(initWidth * zoom);
                                var nowHeight = Math.floor(initHeight * zoom);

                                var isSlideMove = false;
                                if (zoomImageLoading && !(zoomImageLeftMax && ((nowWidth - $(window).width()) / 2) < moveX) && !(zoomImageRightMax && moveX < (-1 * (nowWidth - $(window).width()) / 2))) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                } else {
                                    isSlideMove = true;
                                }

                                // 縦長かどうか
                                var isVertical = ($(window).width() < $(window).height());

                                if (isVertical) {
                                    moveX -= x;
                                    if (!isSlideMove) {
                                        moveY -= y;
                                    }
                                } else {
                                    if (Math.abs(moveX) < Math.abs(y)) {
                                        moveY -= y;
                                    } else {
                                        moveX -= x;
                                    }
                                }

                                imageTransform(img, {initZoom: initZoom, moveX: moveX, moveY: moveY, zoom: zoom}, false)

                            } else {

                                if (zoomImageLoading) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                }

                                // ２点間の面積を算出
                                var w_abs_move = Math.abs(e.touches[1].pageX - e.touches[0].pageX);
                                var h_abs_move = Math.abs(e.touches[1].pageY - e.touches[0].pageY);
                                var touchmove_bar = Math.abs(w_abs_move * h_abs_move);

                                // 前回の２点間の面積から拡大or縮小を判別する。
                                var diff = touchmove_bar / touchstart_bar;
                                touchstart_bar = touchmove_bar;

                                var maxRate = 3;
                                var minRate = 0.1;
                                if (1 < diff) {
                                    zoom *= ((1 + diff) / 2);
                                    // 最大3倍
                                    if (maxRate < zoom) {
                                        zoom = maxRate;
                                    }
                                    // 初期状態でも拡大した場合は、パネルを閉じさせない
                                    if (initZoom === 1 && 1 < zoom) {
                                        initZoom = 1.1;
                                    }
                                } else if (diff < 1) {
                                    zoom *= ((1 + diff) / 2);
                                    // 最小1倍
                                    if (zoom < minRate) {
                                        zoom = minRate;
                                    }

                                }

                                var x = (((pageX1 + pageX2) / 2) - ((e.touches[1].pageX + e.touches[0].pageX) / 2));
                                var y = (((pageY1 + pageY2) / 2) - ((e.touches[1].pageY + e.touches[0].pageY) / 2));

                                moveX -= x;
                                moveY -= y;

                                if (zoom < minRate || maxRate < zoom) {
                                    // 何もしない
                                } else {

                                    imageTransform(img, {
                                        initZoom: initZoom,
                                        moveX: moveX,
                                        moveY: moveY,
                                        zoom: zoom
                                    }, false)

                                }

                            }

//							target.find('.debugText').text('move:' + moveX + 'x' + moveY);

                            // 位置 X,Y 座標を覚えておく
                            pageX1 = e.touches[0].pageX;
                            pageY1 = e.touches[0].pageY;
                            if (multiTap) {
                                pageX2 = e.touches[1].pageX;
                                pageY2 = e.touches[1].pageY;
                            }

                        });
                    }

                    if (!target.hasClass('bind_touchend')) {
                        target.addClass('bind_touchend');

                        //タッチの終了
                        target[0].addEventListener('touchend', touchendEvent, false);
                        target[0].addEventListener('touchcancel', touchendEvent, false);

                        function touchendEvent(e) {

                            // 変化がない場合は何もしない。
                            if (beforeMoveX === moveX && beforeMoveY === moveY && beforeZoom === zoom) {
                                return
                            }

                            // 現在の画像サイズ
                            var nowWidth = Math.floor(initWidth * zoom);
                            var nowHeight = Math.floor(initHeight * zoom);

                            zoomImageLeftMax = false;
                            zoomImageRightMax = false;

                            // 縦長かどうか
                            var isVertical = ($(window).width() < $(window).height());

                            if (isVertical) {

                                // 画面から画像がはみ出した際のリバウンド処理
                                if (zoom === 1) {
                                    // スライダー可能にする。
                                    zoomImageLeftMax = true;
                                    zoomImageRightMax = true;
                                } else if (((nowWidth - $(window).width()) / 2) < moveX) {
                                    // 画面左にはみ出した場合

                                    moveX = ((nowWidth - $(window).width()) / 2);

                                    // スライダー可能にする。
                                    zoomImageLeftMax = true;

                                } else if (moveX < (-1 * (nowWidth - $(window).width()) / 2)) {
                                    // 画面右にはみ出した場合

                                    moveX = (-1 * (nowWidth - $(window).width()) / 2);

                                    // スライダー可能にする。
                                    zoomImageRightMax = true;

                                } else if ($(window).height() < nowHeight) {
                                    // 画面上下にはみ出した場合

                                    zoom = zoom * $(window).height() / nowHeight;

                                }

                                if ($(window).height() <= nowHeight) {
                                    if (((nowHeight - $(window).height()) / 2) < moveY) {
                                        // 画面下にはみ出した場合

                                        moveY = ((nowHeight - $(window).height()) / 2);

                                    } else if (moveY < (-1 * (nowHeight - $(window).height()) / 2)) {
                                        // 画面上にはみ出した場合

                                        moveY = (-1 * (nowHeight - $(window).height()) / 2);

                                    }
                                } else {
                                    moveY = 0;
                                }

                                if (zoom <= 1) {
                                    // 元の表示よりも縮小された場合
                                    zoom = 1;
                                    moveX = 0;
                                    moveY = 0;
                                    zoomImageLeftMax = true;
                                    zoomImageRightMax = true;
                                }


                            } else {

                                // スライダー可能にする。
                                zoomImageLeftMax = true;
                                zoomImageRightMax = true;

                                // 画面から画像がはみ出した際のリバウンド処理
                                if (((nowHeight - $(window).height()) / 2) < moveY) {
                                    // 画面下にはみ出した場合

                                    moveY = ((nowHeight - $(window).height()) / 2);

                                    if (zoom <= 1) {
                                        // 元の表示よりも縮小された場合
                                        zoom = 1;
                                        moveX = 0;
                                        moveY = 0;
                                    }

                                } else if (moveY < (-1 * (nowHeight - $(window).height()) / 2)) {
                                    // 画面上にはみ出した場合

                                    moveY = (-1 * (nowHeight - $(window).height()) / 2);

                                    if (zoom <= 1) {
                                        // 元の表示よりも縮小された場合
                                        zoom = 1;
                                        moveX = 0;
                                        moveY = 0;
                                    }

                                } else if ($(window).width() < nowWidth) {
                                    // 画面上下にはみ出した場合

                                    zoom = zoom * $(window).width() / nowWidth;

                                }

                            }

                            imageTransform(img, {initZoom: initZoom, moveX: moveX, moveY: moveY, zoom: zoom}, true)

                            if (zoom === 1) {
                                setTimeout(function () {
                                    img.css('position', '');
                                    img.css('top', '');
                                    img.css('left', '');
                                    img.closest(childKey).css('text-align', 'center');
                                    zoomImageLoading = false;
                                }, 150);
                            }

                            // 前回の状態を保持しておく
                            beforeMoveX = moveX;
                            beforeMoveY = moveY;
                            beforeZoom = zoom;

                            zoomUpRate = 1;
                            zoomDownRate = 1;
                        }
                    }

                });

            };

            const imageTransform = (img, obj, isAnimate) => {

                if (isAnimate) {
                    img.css({
                        'transition': '-webkit-transform 150ms cubic-bezier(0,0,0.25,1)',
                        '-webkit-transition': '-webkit-transform 150ms cubic-bezier(0,0,0.25,1)',
                        '-moz-transition': '-webkit-transform 150ms cubic-bezier(0,0,0.25,1)',
                        '-ms-transition': '-webkit-transform 150ms cubic-bezier(0,0,0.25,1)'
                    });
                } else {
                    img.css({
                        'transition': '-webkit-transform 0ms',
                        '-webkit-transition': '-webkit-transform 0ms',
                        '-moz-transition': '-webkit-transform 0ms',
                        '-ms-transition': '-webkit-transform 0ms'
                    });
                }

                img.css({
                    'transform': 'translate3d(' + obj.moveX + 'px, ' + obj.moveY + 'px, 0px) scale(' + obj.zoom + ')',
                    '-webkit-transform': 'translate3d(' + obj.moveX + 'px, ' + obj.moveY + 'px, 0px) scale(' + obj.zoom + ')',
                    '-moz-transform': 'translate3d(' + obj.moveX + 'px, ' + obj.moveY + 'px, 0px) scale(' + obj.zoom + ')',
                    '-ms-transform': 'translate3d(' + obj.moveX + 'px, ' + obj.moveY + 'px, 0px) scale(' + obj.zoom + ')'
                });

            }

        })();

        // 自動スライド
        const autoSlide = this.autoSlide = new (function () {
            let timer = null;
            this.on = false;
            this.init = function () {
                start();
                if (hoverPause) {
                    $(ul).hover(function () {
                        stopTimer();
                    }, function () {
                        startTimer();
                    });
                }
            };
            this.restart = function () {
                stopTimer();
                startTimer();
            };
            const start = this.start = function () {
                autoSlide.on = true;
                startTimer();
            };

            function startTimer() {
                if (!autoSlide.on) {
                    return;
                }
                timer = setTimeout(function () {
                    clearInterval(timer);
                    slide(1, animateType);
                    startTimer();
                }, autoSlideInterval);
            }

            const stop = this.stop = function () {
                stopTimer();
                autoSlide.on = false;
            };

            function stopTimer() {
                if (!autoSlide.on) {
                    return;
                }
                clearInterval(timer);
                timer = null;
            }
        })();

        // スライド後の後処理
        const slideAfter = () => {
            if (carousel) {
                doCarousel();
            }

            if (slideCallBackFunc) {
                let data = {};
                data.pageNo = pageNo;
                data.maxPageNo = maxPageNo;
                if (carousel) {
                    data.obj = $(li[pos]);
                } else {
                    data.obj = $(li[(pos - shift)]);
                }
                slideCallBackFunc(data);
            }
        };

        /* Public  */

        // 前ページを表示します。
        const prevPage = this.prevPage = () => {
            if (nowLoading) {
                return;
            }
            // 自動スライドのタイマーをリセットする。
            if (autoSlide.on) {
                autoSlide.restart();
            }
            slide(-1, animateType);
        }

        // 次ページを表示します。
        const nextPage = this.nextPage = () => {
            if (nowLoading) {
                return;
            }
            if (autoSlide.on) {
                // 自動スライドのタイマーをリセットする。
                autoSlide.restart();
            }
            slide(1, animateType);
        }

        // 指定したページを表示します。
        const changePage = this.changePage = (page = 1, animateType) => {
            if (page < 1 || maxPageNo < page) {
                // 指定されたページが範囲外の場合は何もしない。
                return;
            }
            if (autoSlide.on) {
                // 自動スライドのタイマーをリセットする。
                autoSlide.restart();
            }
            // 移動するページ量
            const move = page - pageNo;
            slide(move, animateType);
        }

        /**
         * 動的に子要素を追加します。
         * @param _childs 追加する子要素
         * @param _pos ここで指定した要素の直前に差し込む
         */
        const appendChild = this.appendChild = (_childs, _pos) => {

            if (_childs.length === 0) {
                // 追加要素がない場合は何もしない
                return
            }

            // 既に番兵がある場合はリセット
            ul.find('.cloned').remove()

            li = ul.find(childKey);
            if (_pos === undefined) {
                // 追加位置が未指定の場合は最後に追加する
                _pos = li.length - 1;
            }
            // 追加する位置の直前の子要素
            const prevLi = li.get(_pos)

            if (prevLi) {
                _childs.each(function (index) {
                    const reverseIndex = _childs.length - 1 - index;
                    prevLi.before(_childs[reverseIndex]);
                });
            } else {
                // 追加位置が未定の場合は後ろに追加
                ul.append(_childs)
            }

            // 表示要素をリセットする
            reset();

            const _slide = (move) => {
                pos = pos + (shift * move);

                pageNo = pageNo + move;
                if (pageNo < 1) {
                    pageNo = pageNo + maxPageNo;
                } else if (maxPageNo < pageNo) {
                    pageNo = pageNo - maxPageNo;
                }

                const direction = vertical ? 'top' : 'left';
                if (carousel) {
                    ul.css(direction, '-' + (pos * liwidth) + 'px');
                } else {
                    ul.css(direction, '-' + ((pos - shift) * liwidth) + 'px');
                }
            }
            if (carousel) {
                if (_pos <= (pos - shift)) {
                    // 現在位置の左に追加された場合はページを１つ進める
                    _slide(1)
                }
            } else {
                if (_pos <= pos) {
                    // 現在位置の左に追加された場合はページを１つ進める
                    pos = pos + _childs.length
                    _slide(1)
                    pos = pos - _childs.length
                }
            }

        }

        // 処理開始
        $(this).each(function () {
            init(this);
        });

        return this;
    };

    // アニメーションの種類
    const ANIMATE_TYPE = $.fn.isystkSlider.ANIMATE_TYPE = {
        NO: 0,
        SLIDE: 1,
        FADE: 2
    };

    // デフォルト値
    $.fn.isystkSlider.defaults = {
        'parentKey': 'ul' // 親要素
        , 'childKey': 'li' // 子要素
        , 'responsive': false // 子要素の横幅を画面幅に合わせる
        , 'vertical': false // 縦方向にスライドさせる
        , 'shift': 1 // １ページでスライドさせる子要素の数
        , 'animateType': ANIMATE_TYPE.SLIDE // アニメーションの種類（なし、スライド、フェード）
        , 'slideSpeed': 300 // スライド速度
        , 'carousel': false // １ページ目または、最終ページに到達した場合に、ローテートさせるかどうか
        , 'prevBtnKey': '.prev-btn' // 次ページボタンのセレクタ
        , 'nextBtnKey': '.next-btn' // 前ページボタンのセレクタ
        , 'autoSlide': false // 自動でスライドさせるどうか
        , 'autoSlideInterval': 5000 // 自動でスライドさせる間隔(ミリ秒)
        , 'hoverPause': true // 子要素上にマウスオーバーすると自動スライドを一時停止する。
        , 'swipe': false // スワイプでのページングを可能にするかどうか
        , 'zoom': false // ピンチアウトでズームするかどうか
        , 'slideCallBack': null // スライド後に処理を行うコールバック(本プラグインで想定していない処理はこれを利用してカスタマイズする)
    };

})(jQuery);
