"use strict";

window.addEventListener("load", () => {
	if (typeof [].flat !== "function") {
		const $body = $(`body`);
		$body.addClass("edge__body");
		const $btnClose = $(`<button class="btn btn-danger edge__btn-close"><span class="glyphicon glyphicon-remove"/></button>`)
			.click(() => {
				$overlay.remove();
				$body.removeClass("edge__body");
			});
		const $overlay = $(`<div class="flex-col flex-vh-center relative edge__overlay"/>`);
		$btnClose.appendTo($overlay);
		$overlay.append(`<div class="flex-col flex-vh-center">
			<div class="edge__title mb-2">更新你的瀏覽器</div>
			<div><i>似乎你正在使用過時的/不支持的瀏覽器。<br>
			5etools 推薦使用最新的 <a href="https://www.microsoft.com/zh-cn/edge/" class="edge__link">Edge Chromium</a> 和最新的 <a href="https://www.mozilla.org/firefox/" class="edge__link">Firefox</a>.</i></div>
		</div>`).appendTo($body);
	}
});
