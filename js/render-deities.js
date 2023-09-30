class RenderDeities {
	static $getRenderedDeity (deity) {
		return $$`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getExcludedTr(deity, "deity")}
			${Renderer.utils.getNameTr(deity, {suffix: deity.title ? `，${deity.title.toTitleCase()}` : "", page: UrlUtil.PG_DEITIES})}
			${RenderDeities._getDeityBody(deity)}
			${deity.reprinted ? `<tr class="text"><td colspan="6"><i class="text-muted">注意：此神祇已被重印在較新的出版物中。</i></td></tr>` : ""}
			${Renderer.utils.getPageTr(deity)}
			${deity.previousVersions ? `
			${Renderer.utils.getDividerTr()}
			${deity.previousVersions.map((d, i) => RenderDeities._getDeityBody(d, i + 1)).join(Renderer.utils.getDividerTr())}
			` : ""}
			${Renderer.utils.getBorderTr()}
		`
	}

	static _getDeityBody (deity, reprintIndex) {
		const renderer = Renderer.get();

		const renderStack = [];
		if (deity.entries) {
			renderer.recursiveRender(
				{
					entries: [
						...deity.customExtensionOf ? [`{@note 此神祇是{@deity ${deity.customExtensionOf}}加上來自於 <i title="${Parser.sourceJsonToFull(deity.source).escapeQuotes()}">${Parser.sourceJsonToAbv(deity.source)}</i> 的額外資訊的擴展。}`] : [],
						...deity.entries,
					],
				},
				renderStack,
			);
		}

		if (deity.symbolImg) deity.symbolImg.style = deity.symbolImg.style || "deity-symbol";

		return `
			${reprintIndex ? `
				<tr><td colspan="6">
				<i class="text-muted">
				${reprintIndex === 1 ? `此神祇是重印版本。` : ""} 以下版本被印於較舊的出版物中 (${Parser.sourceJsonToFull(deity.source)}${Renderer.utils.isDisplayPage(deity.page) ? `-第${deity.page}頁` : ""}).
				</i>
				</td></tr>
			` : ""}

			${Renderer.deity.getOrderedParts(deity, `<tr><td colspan="6">`, `</td></tr>`)}

			${deity.symbolImg ? `<tr><td colspan="6">${renderer.render({entries: [deity.symbolImg]})}<div class="mb-2"/></td></tr>` : ""}
			${renderStack.length ? `<tr class="text"><td class="pt-2" colspan="6">${renderStack.join("")}</td></tr>` : ""}
			`;
	}
}
