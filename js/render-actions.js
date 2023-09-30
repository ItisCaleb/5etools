class RenderActions {
	static $getRenderedAction (it) {
		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr(it, "action")}
		${Renderer.utils.getNameTr(it, {page: UrlUtil.PG_ACTIONS})}
		<tr><td class="divider" colspan="6"><div></div></td></tr>
		<tr class="text"><td colspan="6">
		${Renderer.get().setFirstSection(true).render({entries: it.entries})}
		${it.fromVariant ? `<div>${Renderer.get().render(`{@note 該動作是遊戲可選的額外選項，來自於可選/變體規則 {@variantrule ${it.fromVariant}}。}`)}</div>` : ""}
		${it.seeAlsoAction ? `<div>${Renderer.get().render(`{@note 另見：${it.seeAlsoAction.map(it => `{@action ${it}}`).join(", ")}。}`)}</div>` : ""}
		</td></tr>
		${Renderer.utils.getPageTr(it)}
		${Renderer.utils.getBorderTr()}
		`
	}
}
