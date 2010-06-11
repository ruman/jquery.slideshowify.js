/**
 * Slideshowify is a jQuery plugin for generating a full-screen (well, browser dims) slideshow 
 * from images that match a selector.  Images that don't fit the window proportions exactly (generally
 * the case) are cropped and panned across the screen.
 *
 * Author: Aleksandar Kolundzija 
 * version 0.8
 *
 * Should appear on subchild.com, github, and jQuery plugins page at some point soon.
 * Will likely be used on Gallerama.com in some shape or form as well.
 * 
 * @TODO add more configuration options: direction, css3 prog enhancement stuff
 * @TODO consider adding option to pass image data directly to $.slideshowify()
 */

(function($){
	$.fn.slideshowify = function(/* config */){
	
		var _self         = this,
				_imgs         = [],
				_imgIndex     = -1,	
				_imgIndexNext = 0, // for preloading next			
				_fadeTimeoutId,
				_cfg = {
					containerId   : "slideshowify-bg",
					containerCss  : {
						"position" : "absolute",
						"overflow" : "hidden",
						"z-index"  : "-2",
						"left"     : "0",
						"top"      : "0",
						"width"    : "100%",
						"height"   : "100%"
					},
					transition    : "into", // "into" || "toBg"
					fadeInSpeed   : 2000,
					fadeOutSpeed  : 2000,
					aniSpeedMin   : 3000, // min animate speed
					aniSpeedMax   : 8000,  // max animate speed
					afterFadeIn   : function(){},
					beforeFadeOut : function(){}
				};
			
		if (arguments[0]){
			$.extend(_cfg, arguments[0]); // reconfigure
		}
			
		/**
		 * Fills screen with image (most likely cropped based on its dimensions and window size).
		 * @TODO Add a resize handler to adjust photo dimensions and margins
		 */
		function _adjustImgDimsAndRender(curImg){
			var $doc     = $(document),
					$img     = $(this),
					docW     = $doc.width(),
					docH     = $doc.height(),
					docRatio = docW/docH,
					imgRatio = $img.width()/$img.height(),
					aniSpeed = _cfg.aniSpeedMin;
			if (imgRatio > docRatio){
				$img.height(docH+"px").width(curImg.w*(docH/curImg.h)+"px");				
				marginPixels = $img.width()-docW;
				marginAttr   = {"margin-left":"-"+marginPixels+"px"};
			}
			else {
				$img.width(docW+"px").height(curImg.h*(docW/curImg.w)+"px");				
				marginPixels = $img.height()-docH;
				marginAttr   = {"margin-top":"-"+marginPixels+"px"};
			}
			aniSpeed = Math.min(Math.max(marginPixels * 50, _cfg.aniSpeedMin), _cfg.aniSpeedMax);
			$img
				.fadeIn(_cfg.fadeInSpeed, function(){
					$img.css("z-index", -1);
					_cfg.afterFadeIn();
				})
				.animate(marginAttr, {
					duration : aniSpeed,
					queue    : false,
					complete : function(){ 
						// _advance.call(this);
						_cfg.beforeFadeOut();
						$(this).fadeOut(_cfg.fadeOutSpeed, function(){
							$(this).remove();
						});
						_showImg();
					}
				});
		}	

	
		/**
		 * Fades out current image and calls starts display of next one
		 */
//		function _advance(){
//			$(this).fadeOut(_cfg.fadeOutSpeed, function(){
//				$(this).remove();
//			});
//			_showImg();
//		}	
	
		
		/**
		 * Loads image and starts display flow
		 * @TODO fix preloading stuff; only preload images once (don't loop)
		 */
		function _showImg(){
			var img     = new Image(),
					nextImg = new Image(), // for preloading
					len     = _imgs.length;
				
			_imgIndex = (_imgIndex < len-1) ? _imgIndex+1 : 0;
			clearTimeout(_fadeTimeoutId); // @TODO need to be able to clear this timeout externally
		
			$(img)
				// assign handlers
				.load(function(){
					if (_cfg.transition==="into"){
						$(this).css({"position":"absolute", "z-index":"-2"});
						$("#"+_cfg.containerId).append(this);
					}
					else {
						$("#"+_cfg.containerId).empty().append(this);
					}
					_adjustImgDimsAndRender.call(this, _imgs[_imgIndex]);
				})
				.error(function(){
					alert("Oops, can't load the image.");
				})
				.hide()
				.attr("src", _imgs[_imgIndex].src); // load/show image
			
			// preload next image
			_imgIndexNext = _imgIndex + 1;
			if (_imgIndexNext < len-1){
				nextImg.src = _imgs[_imgIndexNext].src;
			}
		}
		

		if (!_cfg.imgs){ // if images weren't passed as array, load from object
			// load images into private array
			$(this).each(function(i, img){
				$(img).hide();
				_imgs.push({
					src : $(img).attr("src"),
					w   : $(img).width(),
					h   : $(img).height()
				});
			});
		}
		else {
			_imgs = _cfg.imgs;
		}
	
		// create container div 
		$("<div id='"+_cfg.containerId+"'></div>")
			.css(_cfg.containerCss)
			.appendTo("body");
	
		// start
		_showImg();
		
		return this;
	};
		
}(jQuery));



/**
 * Make slideshowify accessible as a function that can be passed a data URL
 * @TODO add support for image array as a parameter (no need for ajax)
 */ 
$.slideshowify = function(cfg){
	
	var _self = this,
			_cfg  = {
				randomize : false,
				dataUrl   : "",
				dataType  : "json",
				async     : true,
				filterFn  : function(data){ return data; } // default filter. does nothing
			};
			
	$.extend(_cfg, cfg);
	
	$.ajax({
		url      : _cfg.dataUrl,
		dataType : _cfg.dataType,
		async    : _cfg.async,
		success  : function(imgs){
			_cfg.imgs = _cfg.filterFn(imgs);			
			if (_cfg.randomize){ 
				_cfg.imgs.sort(function(){
					return 0.5 - Math.random();
				});
			}
			$({}).slideshowify(_cfg);
		}
	});
	
};
