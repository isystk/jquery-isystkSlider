$(function () {

    $('.isystk-slider').each(function () {
        const self = $(this),
            shift = self.data('shift') ?? 1,
            carousel = self.data('carousel'),
            autoSlide = self.data('auto-slide'),
            vertical = self.data('vertical'),
            responsive = self.data('responsive'),
            swipe = self.data('swipe');

        const maxPageNo = Math.ceil(self.find('.child').length / shift);

        // ページ番号を設定する
        const setPageNo = ({pageNo, maxPageNo}) => {
            self.find('.page-no').text(`${pageNo}/${maxPageNo}`);
        }
        setPageNo({
            pageNo: 1,
            maxPageNo
        })

        let nowPage = 1;
        const slider = self.isystkSlider({
            'parentKey': '.parent',
            'childKey': '.child',
            'prevBtnKey': self.find('.prev-btn'),
            'nextBtnKey': self.find('.next-btn'),
            shift,
            carousel,
            responsive,
            swipe,
            vertical,
            autoSlide,
            'slideCallBack': function ({pageNo, maxPageNo}) {
                nowPage = pageNo;
                // ページ番号を設定する
                setPageNo({pageNo, maxPageNo})
                // ページ番号（ドット）を選択する
                slider.find('.paging li').removeClass('active');
                slider.find('.paging li:eq(' + (pageNo - 1) + ')').addClass('active');
            }
        });
        for (let pageNo = 1; pageNo <= maxPageNo; pageNo++) {
            slider.find('.paging')
                .append(`<li class="${(pageNo === 1) ? 'active' : ''}" data-page-no="${pageNo}"></li>`);
        }
        slider.find('.paging li').click(function (e) {
            e.preventDefault();
            slider.changePage($(this).data('page-no'), $.fn.isystkSlider.ANIMATE_TYPE.SLIDE);
        });
        // 動的なページの追加
        slider.find('.addPrevBtn').click(function () {
            const ul = slider.find('.addData'),
                li = ul.find('li').slice(0, 3);
            slider.appendChild(li, ((nowPage - 1) * shift))
        });
        slider.find('.addAfterBtn').click(function () {
            const ul = slider.find('.addData'),
                li = ul.find('li').slice(0, 3);
            slider.appendChild(li, (nowPage * shift))
        });
    });

    window.onload = function() {
        // 動画
        $('img.js-movie').isystkMovie();
        
        // 拡大画像スライダー
        $('.zoom-slider').each(function () {
            $(this).zoomSlider({
                targetClass: 'img.zoom',
                color: 'white',
            });
        });

        // 拡大画像スライダー（縦方向）
        $('.zoom-slider-vertical').each(function () {
            $(this).zoomSlider({
                targetClass: 'img.zoom',
                vertical: true
            });
        });

    }

});
