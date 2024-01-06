
$(function() {

	$('.isystk-slider').each(function () {
		const self = $(this),
			shift = self.data('shift'),
			carousel = self.data('carousel'),
			autoSlide = self.data('auto-slide'),
			vertical = self.data('vertical'),
			responsive = self.data('responsive'),
			swipe = self.data('swipe');
		
		// ページ番号を設定する
		const setPageNo = ({pageNo, maxPageNo}) => {
			self.find('.page-no').text(`${pageNo}/${maxPageNo}`);
		}
		setPageNo({
			pageNo: 1,
			maxPageNo: Math.ceil(self.find('.child').length / shift)
		})

		const slider = self.isystkSlider( {
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
			'slideCallBack': function({pageNo, maxPageNo}) {
				// ページ番号を設定する
				setPageNo({pageNo, maxPageNo})
				// ページ番号（ドット）を選択する
				slider.find('.paging li').removeClass('active');
				slider.find('.paging li:eq('+(pageNo-1)+')').addClass('active');
			}
		});
		slider.find('.paging li').click(function(e) {
			e.preventDefault();
			slider.changePage($(this).data('page-no'), $.fn.isystkSlider.ANIMATE_TYPE.SLIDE);
		});
	});

	// 動画
	$('img.js-movie').isystkMovie();

	// 拡大画像スライダー
	$('.zoom-slider').each(function() {
		$(this).zoomSlider({
			'targetClass': '.zoom',
		});
	});
});


