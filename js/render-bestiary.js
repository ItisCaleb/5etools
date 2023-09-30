class RenderBestiary {
	static _getRenderedSection (sectionTrClass, sectionEntries, sectionLevel) {
		const renderer = Renderer.get();
		const renderStack = [];
		if (sectionTrClass === "lairaction" || sectionTrClass === "regionaleffect") {
			renderer.recursiveRender({entries: sectionEntries}, renderStack, {depth: sectionLevel + 2});
		} else if (sectionTrClass === "legendary" || sectionTrClass === "mythic") {
			const cpy = MiscUtil.copy(sectionEntries).map(it => {
				if (it.name && it.entries) {
					it.name = `${it.name}.`;
					it.type = it.type || "item";
				}
				return it;
			});
			const toRender = {type: "list", style: "list-hang-notitle", items: cpy};
			renderer.recursiveRender(toRender, renderStack, {depth: sectionLevel});
		} else {
			sectionEntries.forEach(e => {
				if (e.rendered) renderStack.push(e.rendered);
				else renderer.recursiveRender(e, renderStack, {depth: sectionLevel + 1});
			});
		}
		return `<tr class="${sectionTrClass}"><td colspan="6" class="mon__sect-row-inner">${renderStack.join("")}</td></tr>`;
	}

	static _getPronunciationButton (mon) {
		return `<button class="btn btn-xs btn-default btn-name-pronounce ml-2">
			<span class="glyphicon glyphicon-volume-up name-pronounce-icon"></span>
			<audio class="name-pronounce">
			   <source src="${Renderer.utils.getMediaUrl(mon, "soundClip", "audio")}" type="audio/mpeg">
			</audio>
		</button>`;
	}

	/**
	 * @param {Object} mon Creature data.
	 * @param {Object} options
	 * @param {jQuery} options.$btnScaleCr CR scaler button.
	 * @param {jQuery} options.$btnResetScaleCr CR scaler reset button.
	 */
	static $getRenderedCreature (mon, options) {
		options = options || {};
		const renderer = Renderer.get();
		Renderer.monster.initParsed(mon);

		const fnGetSpellTraits = Renderer.monster.getSpellcastingRenderedTraits.bind(Renderer.monster, renderer);
		const allTraits = Renderer.monster.getOrderedTraits(mon, {fnGetSpellTraits});
		const allActions = Renderer.monster.getOrderedActions(mon, {fnGetSpellTraits});
		const legGroup = DataUtil.monster.getMetaGroup(mon);

		const renderedVariants = (() => {
			const dragonVariant = Renderer.monster.getDragonCasterVariant(renderer, mon);
			const variants = mon.variant;
			if (!variants && !dragonVariant) return null;
			else {
				const rStack = [];
				(variants || []).forEach(v => renderer.recursiveRender(v, rStack));
				if (dragonVariant) rStack.push(dragonVariant);
				return `<td colspan=6>${rStack.join("")}</td>`;
			}
		})();

		const htmlSourceAndEnvironment = (() => {
			const srcCpy = {
				source: mon.source,
				page: mon.page,
				srd: mon.srd,
				sourceSub: mon.sourceSub,
				otherSources: mon.otherSources,
				additionalSources: mon.additionalSources,
				externalSources: mon.externalSources,
			};
			const additional = mon.additionalSources ? MiscUtil.copy(mon.additionalSources) : [];
			if (mon.variant && mon.variant.length > 1) {
				mon.variant.forEach(v => {
					if (v.variantSource) {
						additional.push({
							source: v.variantSource.source,
							page: v.variantSource.page,
						})
					}
				})
			}
			srcCpy.additionalSources = additional;

			const pageTrInner = Renderer.utils.getSourceAndPageTrHtml(srcCpy);
			if (mon.environment && mon.environment.length) {
				return [pageTrInner, `<div class="mb-1 mt-2"><b>環境：</b> ${mon.environment.sort(SortUtil.ascSortLower).map(it => Parser.EnvironmentToDisplay(it)).join(", ")}</div>`];
			} else {
				return [pageTrInner];
			}
		})();

		const hasToken = (mon.tokenUrl && mon.uniqueId) || mon.hasToken;
		const extraThClasses = hasToken ? ["mon__name--token"] : null;

		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getExcludedTr(mon, "monster", UrlUtil.PG_BESTIARY)}
		${Renderer.utils.getNameTr(mon, {controlRhs: mon.soundClip ? RenderBestiary._getPronunciationButton(mon) : "", extraThClasses, page: UrlUtil.PG_BESTIARY, extensionData: mon._isScaledCr})}
		<tr><td colspan="6">
			<div ${hasToken ? `class="mon__wrp-size-type-align--token"` : ""}><i>${Renderer.monster.getTypeAlignmentPart(mon)}</i></div>
		</td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>

		<tr><td colspan="6"><div ${hasToken ? `class="mon__wrp-avoid-token"` : ""}><strong>護甲等級：</strong> ${Parser.acToFull(mon.ac)}</div></td></tr>
		<tr><td colspan="6"><div ${hasToken ? `class="mon__wrp-avoid-token"` : ""}><strong>生命值：</strong> ${Renderer.monster.getRenderedHp(mon.hp)}</div></td></tr>
		<tr><td colspan="6"><strong>速度：</strong> ${Parser.getSpeedString(mon)}</td></tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>

		<tr class="mon__ability-names">
			<th>力量</th><th>敏捷</th><th>體質</th><th>智力</th><th>感知</th><th>魅力</th>
		</tr>
		<tr class="mon__ability-scores">
			${Parser.ABIL_ABVS.map(ab => `<td>${Renderer.utils.getAbilityRoller(mon, ab)}</td>`).join("")}
		</tr>
		<tr><td class="divider" colspan="6"><div></div></td></tr>

		${mon.save ? `<tr><td colspan="6"><strong>豁免：</strong> ${Renderer.monster.getSavesPart(mon)}</td></tr>` : ""}
		${mon.skill ? `<tr><td colspan="6"><strong>技能：</strong> ${Renderer.monster.getSkillsString(renderer, mon)}</td></tr>` : ""}
		${mon.vulnerable ? `<tr><td colspan="6"><strong>傷害易傷：</strong> ${Parser.getFullImmRes(mon.vulnerable)}</td></tr>` : ""}
		${mon.resist ? `<tr><td colspan="6"><strong>傷害抗性：</strong> ${Parser.getFullImmRes(mon.resist)}</td></tr>` : ""}
		${mon.immune ? `<tr><td colspan="6"><strong>傷害免疫：</strong> ${Parser.getFullImmRes(mon.immune)}</td></tr>` : ""}
		${mon.conditionImmune ? `<tr><td colspan="6"><strong>狀態免疫：</strong> ${Parser.getFullCondImm(mon.conditionImmune)}</td></tr>` : ""}
		<tr><td colspan="6"><strong>感官：</strong> ${Renderer.monster.getSensesPart(mon)}</td></tr>
		<tr><td colspan="6"><strong>語言：</strong> ${Renderer.monster.getRenderedLanguages(mon.languages)}</td></tr>

		<tr>${Parser.crToNumber(mon.cr) < VeCt.CR_UNKNOWN ? $$`
		<td colspan="6" class="relative"><strong>挑戰等級</strong>
			<span>${Parser.monCrToFull(mon.cr, {isMythic: !!mon.mythic})}</span>
			${options.$btnScaleCr || ""}
			${options.$btnResetScaleCr || ""}
		</td>
		` : `<td colspan="6" class="relative"><strong>Challenge</strong> <span>\u2014</span></td>`}</tr>

		${mon.pbNote ? `<tr><td colspan="6"><strong>熟練加值 (PB)</strong> ${mon.pbNote}</td></tr>` : ""}

		${allTraits ? `<tr><td class="divider" colspan="6"><div></div></td></tr>${RenderBestiary._getRenderedSection("trait", allTraits, 1)}` : ""}
		${allActions ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">動作${mon.actionNote ? ` (<span class="small">${mon.actionNote}</span>)` : ""}</span></td></tr>
		${RenderBestiary._getRenderedSection("action", allActions, 1)}` : ""}
		${mon.bonus ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">附贈動作</span></td></tr>
		${RenderBestiary._getRenderedSection("bonus", mon.bonus, 1)}` : ""}
		${mon.reaction ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">反應</span></td></tr>
		${RenderBestiary._getRenderedSection("reaction", mon.reaction, 1)}` : ""}
		${mon.legendary ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">傳奇動作</span></td></tr>
		<tr class="legendary"><td colspan="6"><span class="name"></span> <span>${Renderer.monster.getLegendaryActionIntro(mon)}</span></td></tr>
		${RenderBestiary._getRenderedSection("legendary", mon.legendary, 1)}` : ""}
		${mon.mythic ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">Mythic Actions</span></td></tr>
		<tr class="mythic"><td colspan="6"><span class="name"></span> <span>${Renderer.monster.getMythicActionIntro(mon)}</span></td></tr>
		${RenderBestiary._getRenderedSection("mythic", mon.mythic, 1)}` : ""}

		${legGroup && legGroup.lairActions ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">巢穴動作</span></td></tr>
		${RenderBestiary._getRenderedSection("lairaction", legGroup.lairActions, -1)}` : ""}
		${legGroup && legGroup.regionalEffects ? `<tr><td colspan="6" class="mon__stat-header-underline"><span class="mon__sect-header-inner">區域效應</span></td></tr>
		${RenderBestiary._getRenderedSection("regionaleffect", legGroup.regionalEffects, -1)}` : ""}

		${renderedVariants ? `<tr>${renderedVariants}</tr>` : ""}
		${mon.footer ? `<tr><td colspan=6 class="mon__sect-row-inner">${renderer.render({entries: mon.footer})}</td></tr>` : ""}
		${htmlSourceAndEnvironment.length === 2 ? `<tr><td colspan="6">${htmlSourceAndEnvironment[1]}</td></tr>` : ""}
		<tr><td colspan="6">${htmlSourceAndEnvironment[0]}</td></tr>
		${Renderer.utils.getBorderTr()}`;
	}

	static $getRenderedLegendaryGroup (legGroup) {
		return $$`
		${Renderer.utils.getBorderTr()}
		${Renderer.utils.getNameTr(legGroup)}
		<tr class="text"><td colspan="6" class="text">
			${legGroup.lairActions && legGroup.lairActions.length ? Renderer.get().render({type: "entries", entries: [{type: "entries", name: "Lair Actions", entries: legGroup.lairActions}]}) : ""}
			${legGroup.regionalEffects && legGroup.regionalEffects.length ? Renderer.get().render({type: "entries", entries: [{type: "entries", name: "Regional Effects", entries: legGroup.regionalEffects}]}) : ""}
			${legGroup.mythicEncounter && legGroup.mythicEncounter.length ? Renderer.get().render({type: "entries", entries: [{type: "entries", name: `<i title="This will display the creature's name when this legendary group is referenced from a creature statblock." class="help-subtle">&lt;Creature Name&gt;</i> as a Mythic Encounter`, entries: legGroup.mythicEncounter}]}) : ""}
		</td></tr>
		${Renderer.utils.getBorderTr()}`;
	}
}
