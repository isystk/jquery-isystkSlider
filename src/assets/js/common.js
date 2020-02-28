
$(function() {

	// 動くマーカー線
	$(window).scroll(function (){
		$(".entry-content strong").each(function(){
			var position = $(this).offset().top;
			var scroll = $(window).scrollTop();
			var windowHeight = $(window).height();
			if (scroll > position - windowHeight){
				$(this).addClass('active');
			}
		});
	});

	// ページトップに戻るボタンを表示
	(function () {
		$('<span id="page-top" class="link"><a href="#">^</a></span>').appendTo('body');
		var topBtn = $('#page-top'),
			showFlg = false;
		var scroll = function (scrollTop) {
			if (scrollTop > 100) {
				if (showFlg == false) {
					showFlg = true;
					topBtn.removeClass('hide');
				}
			} else {
				if (showFlg) {
					showFlg = false;
					topBtn.addClass('hide');
				}
			}
		} 
		//スクロールが100に達したらボタン表示
		$(window).scroll(function () {
			scroll($(this).scrollTop());
		});
		//スクロールしてトップ
		topBtn.click(function () {
			$('body,html').animate({
				scrollTop: 0
			}, 500);
			return false;
		});
		scroll($(window).scrollTop());
	}());

	// ソースコードの表示
	$('pre.code').each(function() {
		var self = $(this),
			code = self.find('code'),
			text = code.text();
		self.addClass('prettyprint');
		self.addClass('linenums');
		code.empty().text(text);
	});
	prettyPrint();

  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      $('.sidebar-wrapper').addClass('fixed');
    } else {
      $('.sidebar-wrapper').removeClass('fixed');
    }
	});
	
	// ページ内見出しナビゲーション
	$('#sticky-navigator').stickyNavigator({wrapselector: '.entry-content'});

	$('.js-slider').each(function() {
		var self = $(this),
			shift = self.data('shift'),
			carousel = self.data('carousel'),
			autoSlide = self.data('auto-slide');
		var slider = self.isystkSlider({
			'parentKey': '.parent',
			'childKey': '.child',
			'shift': shift,
			'carousel': carousel,
			'autoSlide': autoSlide,
			'prevBtnKey': self.find('.prev-btn'),
			'nextBtnKey': self.find('.next-btn'),
			'slideCallBack': function(data) {
				slider.find('.slide_dot li').removeClass('active');
				slider.find('.slide_dot li:eq('+(data.pageNo-1)+')').addClass('active');
			}
		});
		slider.find('.slide_dot li').click(function(e) {
			e.preventDefault();
			slider.changePage($(this).data('pageno'), $.fn.isystkSlider.ANIMATE_TYPE.SLIDE);
		});
	});

});


