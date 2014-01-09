/***
!!!IMPORTANT: This frame is based on jQuery
***/

/***
Auto Start
***/
$(document).ready(function(){
	$mx.preload();
});

/***
Main
***/
if (typeof($mx) == 'undefined'){var $mx = {};}
(function($mx){
	$mx.preloadItemContainerId = 'mxFramePreloadItemContainer';
	$mx.preloadItemHTML = 'mxFrame/items/default.html';
	$mx.preloadItemCSS = 'mxFrame/items/default.css';
	$mx.preloadModelJS = 'mxFrame/models/default.js';
	$mx.autoSetIdCounter = 0;
	$mx.logSwitcher = 'ON';
	$mx.item = {};
	$mx.itemAttrs = {};

	$mx.preload = function(){
		$('body').after('<div style = "display:none;" id = "' + $mx.preloadItemContainerId + '"></div>');
		$('head').append('<link rel = "stylesheet" href = "' + $mx.preloadItemCSS + '" />');
		$('body').after('<script type = "text/javascript" src = "' + $mx.preloadModelJS + '"></script>');
		$('#' + $mx.preloadItemContainerId).load($mx.preloadItemHTML,function(){
			$mx.renderItems();
		});
	}

	$mx.renderItems = function($scanElement){
		if ($scanElement == null){$scanElement = $('body');}
		if (!$scanElement.length > 0){log('Fail to scan an item that not exist.');}
		$scanElement.find('item').each(function(){
			var $item = $(this);
			$mx.renderItem($item);
		});
	}

	$mx.renderItem = function($item){
		//Information Preparation
		$mx.itemAttrs = $item.attrs();
		var itemName = $mx.itemAttrs['name'],
			itemId = $mx.itemAttrs['id'],
			itemClass = $mx.itemAttrs['class'],
			itemType = $mx.itemAttrs['type'],
			itemHTML = $item.html();

		if (itemName == null){
			log('Fail to render an item without name:');
			log($item);
			return false;
		}
		if (itemId == null){
			itemId = itemName + '_' + $mx.autoSetIdCounter;
			$mx.autoSetIdCounter++;
			$item.attr('id',itemId);
			log('Auto set an item ID as [' + itemId + ']:');
			log($item);
		}
		if (itemClass == null){
			itemClass = itemName + '_default';
			log('Auto set an item Class as [' + itemClass + ']:');
			log($item);
		}else{
			itemClass = itemName + '_' + itemClass;
		}
		$item.attr('class',itemClass);

		//Load Template
		var $itemTemplate = $('#' + $mx.preloadItemContainerId).find(itemName);
		if (!$itemTemplate.length > 0){
			log('Fail to render an item that have no template:');
			log($item);
			return false;
		}

		//Preload
		var itemTemplatePreload = $itemTemplate.find('preload').html();
		$mx.item = $itemTemplate;
		if (itemTemplatePreload != null){
			eval(itemTemplatePreload);
		}

		//Render
		var itemTemplateHTML = $itemTemplate.find('item').html();
		if (itemTemplateHTML == null){itemTemplateHTML = '';}
		if (itemHTML != null){
			var itemReplacementHTML = itemTemplateHTML.replace(/\{\$html\}/gm,itemHTML);
		}else{
			var itemReplacementHTML = itemTemplateHTML;
		}
		for (var attrName in $mx.itemAttrs){
			var reg = new RegExp('\\\{\\\$' + attrName + '\\\}','gm');
			log(reg);
			itemReplacementHTML = itemReplacementHTML.replace(reg,$mx.itemAttrs[attrName]);
		}
		$item.html(itemReplacementHTML);

		//Callback
		var itemTemplateCallback = $itemTemplate.find('callback').html();
		eval(itemTemplateCallback);

		$mx.item = {};
		$mx.itemAttrs = {};
	}
})($mx);

/***
jQuery Plug-in
***/
(function($){
	$.fn.attrs = function(){
		var $tag = $(this),
			tagAttrs = $tag[0].attributes,
			tagAttrsCount = tagAttrs.length,
			tagAttrsResult = {};

		for (var i = 0;i < tagAttrsCount;i++){
			tagAttrsResult[tagAttrs[i].name.toLowerCase()] = tagAttrs[i].value;
		}

		return tagAttrsResult;
	}
})(jQuery)

/***
Log Tools
***/
function log(content){
	if ($mx.logSwitcher == 'ON'){console.log(content);}
}
