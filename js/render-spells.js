class RenderSpells {
	static $getRenderedSpell (sp, subclassLookup) {
		const renderer = Renderer.get();

		const renderStack = [];
		renderer.setFirstSection(true);

		renderStack.push(`
			${Renderer.utils.getBorderTr()}
			${Renderer.utils.getExcludedTr(sp, "spell", UrlUtil.PG_SPELLS)}
			${Renderer.utils.getNameTr(sp, {page: UrlUtil.PG_SPELLS})}
			<tr><td class="rd-spell__level-school-ritual" colspan="6"><span>${Parser.spLevelSchoolMetaToFull(sp.level, sp.school, sp.meta, sp.subschools)}</span></td></tr>
			<tr><td colspan="6"><span class="bold">施法時間：</span>${Parser.spTimeListToFull(sp.time)}</td></tr>
			<tr><td colspan="6"><span class="bold">射程：</span>${Parser.spRangeToFull(sp.range)}</td></tr>
			<tr><td colspan="6"><span class="bold">構材：</span>${Parser.spComponentsToFull(sp.components, sp.level)}</td></tr>
			<tr><td colspan="6"><span class="bold">持續時間：</span>${Parser.spDurationToFull(sp.duration)}</td></tr>
			${Renderer.utils.getDividerTr()}
		`);

		const entryList = {type: "entries", entries: sp.entries};
		renderStack.push(`<tr class="text"><td colspan="6" class="text">`);
		renderer.recursiveRender(entryList, renderStack, {depth: 1});
		if (sp.entriesHigherLevel) {
			const higherLevelsEntryList = {type: "entries", entries: sp.entriesHigherLevel};
			renderer.recursiveRender(higherLevelsEntryList, renderStack, {depth: 2});
		}
		renderStack.push(`</td></tr>`);

		const stackFroms = [];

		const fromClassList = Renderer.spell.getCombinedClasses(sp, "fromClassList");
		if (fromClassList.length) {
			const [current, legacy] = Parser.spClassesToCurrentAndLegacy(fromClassList);
			stackFroms.push(`<div><span class="bold">職業：</span>${Parser.spMainClassesToFull(current)}</div>`);
			if (legacy.length) stackFroms.push(`<div class="text-muted"><span class="bold">職業（舊版）：</span>${Parser.spMainClassesToFull(legacy)}</div>`);
		}

		const fromSubclass = Renderer.spell.getCombinedClasses(sp, "fromSubclass");
		if (fromSubclass.length) {
			const [current, legacy] = Parser.spSubclassesToCurrentAndLegacyFull(sp, subclassLookup);
			stackFroms.push(`<div><span class="bold">子職業：</span>${current}</div>`);
			if (legacy.length) {
				stackFroms.push(`<div class="text-muted"><span class="bold">子職業（舊版）：</span>${legacy}</div>`);
			}
		}

		const fromClassListVariant = Renderer.spell.getCombinedClasses(sp, "fromClassListVariant");
		if (fromClassListVariant.length) {
			const [current, legacy] = Parser.spVariantClassesToCurrentAndLegacy(fromClassListVariant);
			if (current.length) {
				stackFroms.push(`<div><span class="bold">可選/變體職業：</span>${Parser.spMainClassesToFull(current)}</div>`);
			}
			if (legacy.length) {
				stackFroms.push(`<div class="text-muted"><span class="bold">可選/變體職業（舊版）：</span>${Parser.spMainClassesToFull(legacy)}</div>`);
			}
		}

		const fromRaces = Renderer.spell.getCombinedRaces(sp);
		if (fromRaces.length) {
			fromRaces.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
			stackFroms.push(`<div><span class="bold">種族：</span>${fromRaces.map(r => `${SourceUtil.isNonstandardSource(r.source) ? `<span class="text-muted">` : ``}${renderer.render(`{@race ${Parser.RaceToDisplay(r.name)}|${r.source}}`)}${SourceUtil.isNonstandardSource(r.source) ? `</span>` : ``}`).join("、")}</div>`);
		}

		const fromBackgrounds = Renderer.spell.getCombinedBackgrounds(sp);
		if (fromBackgrounds.length) {
			fromBackgrounds.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
			stackFroms.push(`<div><span class="bold">背景：</span>${fromBackgrounds.map(r => `${SourceUtil.isNonstandardSource(r.source) ? `<span class="text-muted">` : ``}${renderer.render(`{@background ${r.name}|${r.source}}`)}${SourceUtil.isNonstandardSource(r.source) ? `</span>` : ``}`).join("、")}</div>`);
		}

		if (sp.eldritchInvocations) {
			sp.eldritchInvocations.sort((a, b) => SortUtil.ascSortLower(a.name, b.name) || SortUtil.ascSortLower(a.source, b.source));
			stackFroms.push(`<div><span class="bold">魔能祈喚：</span>${sp.eldritchInvocations.map(r => `${SourceUtil.isNonstandardSource(r.source) ? `<span class="text-muted">` : ``}${renderer.render(`{@optfeature ${r.name}|${r.source}}`)}${SourceUtil.isNonstandardSource(r.source) ? `</span>` : ``}`).join("、")}</div>`);
		}

		if (stackFroms.length) {
			renderStack.push(`<tr class="text"><td colspan="6">${stackFroms.join("")}</td></tr>`)
		}

		if (sp._scrollNote) {
			renderStack.push(`<tr class="text"><td colspan="6"><section class="text-muted">`);
			renderer.recursiveRender(`{@italic 注意：{@class 戰士||戰士（魔能騎士）|Eldritch Knight}和{@class 遊蕩者||遊蕩者（詭術師）|Arcane Trickster} 的法術列表包含了所有{@class 法師}法術。5環或更高環位法術可以在法術卷軸或者類似物品的幫助下施放。}`, renderStack, {depth: 2});
			renderStack.push(`</section></td></tr>`);
		}

		renderStack.push(`
			${Renderer.utils.getPageTr(sp)}
			${Renderer.utils.getBorderTr()}
		`);

		return $(renderStack.join(""));
	}
}
