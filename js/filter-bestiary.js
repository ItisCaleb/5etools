"use strict";

class PageFilterBestiary extends PageFilter {
	// region static
	static sortMonsters (a, b, o) {
		if (o.sortBy === "count") return SortUtil.ascSort(a.values.count, b.values.count) || SortUtil.compareListNames(a, b);
		switch (o.sortBy) {
			case "name": return SortUtil.compareListNames(a, b);
			case "type": return SortUtil.ascSort(a.values.type, b.values.type) || SortUtil.compareListNames(a, b);
			case "source": return SortUtil.ascSort(a.values.source, b.values.source) || SortUtil.compareListNames(a, b);
			case "cr": return SortUtil.ascSortCr(a.values.cr, b.values.cr) || SortUtil.compareListNames(a, b);
		}
	}

	static ascSortMiscFilter (a, b) {
		a = a.item;
		b = b.item;
		if (a.includes(PageFilterBestiary.MISC_FILTER_SPELLCASTER) && b.includes(PageFilterBestiary.MISC_FILTER_SPELLCASTER)) {
			a = Parser.attFullToAbv(a.replace(PageFilterBestiary.MISC_FILTER_SPELLCASTER, ""));
			b = Parser.attFullToAbv(b.replace(PageFilterBestiary.MISC_FILTER_SPELLCASTER, ""));
			return SortUtil.ascSortAtts(a, b);
		} else {
			a = Parser.monMiscTagToFull(a);
			b = Parser.monMiscTagToFull(b);
			return SortUtil.ascSortLower(a, b);
		}
	}

	static getAllImmRest (toParse, key) {
		const out = [];
		for (const it of toParse) this._getAllImmRest_recurse(it, key, out); // Speed > safety
		return out;
	}

	static _getAllImmRest_recurse (it, key, out, conditional) {
		if (typeof it === "string") {
			out.push(conditional ? `${it} (Conditional)` : it);
		} else if (it[key]) {
			it[key].forEach(nxt => this._getAllImmRest_recurse(nxt, key, out, !!it.cond));
		}
	}
	// endregion

	constructor () {
		super();

		this._crFilter = new RangeFilter({
			header: "Challenge Rating",
			headerName: "挑戰等級",
			isLabelled: true,
			labelSortFn: SortUtil.ascSortCr,
			labels: [...Parser.CRS, "Unknown", "\u2014"],
			labelDisplayFn: it => it === "\u2014" ? "None" : it,
		});
		this._sizeFilter = new Filter({
			header: "Size",
			headerName: "體型",
			items: [
				SZ_TINY,
				SZ_SMALL,
				SZ_MEDIUM,
				SZ_LARGE,
				SZ_HUGE,
				SZ_GARGANTUAN,
				SZ_VARIES,
			],
			displayFn: Parser.sizeAbvToFull,
			itemSortFn: null,
		});
		this._speedFilter = new RangeFilter({header: "Speed", headerName: "速度", min: 30, max: 30});
		this._speedTypeFilter = new Filter({header: "Speed Type", headerName: "速度類型", items: ["walk", "burrow", "climb", "fly", "hover", "swim"], displayFn: Parser.SpeedToDisplay});
		this._strengthFilter = new RangeFilter({header: "Strength", headerName: "力量", min: 1, max: 30});
		this._dexterityFilter = new RangeFilter({header: "Dexterity", headerName: "敏捷", min: 1, max: 30});
		this._constitutionFilter = new RangeFilter({header: "Constitution", headerName: "體質", min: 1, max: 30});
		this._intelligenceFilter = new RangeFilter({header: "Intelligence", headerName: "智力", min: 1, max: 30});
		this._wisdomFilter = new RangeFilter({header: "Wisdom", headerName: "感知", min: 1, max: 30});
		this._charismaFilter = new RangeFilter({header: "Charisma", headerName: "魅力", min: 1, max: 30});
		this._abilityScoreFilter = new MultiFilter({
			header: "Ability Scores",
			headerName: "屬性值",
			filters: [this._strengthFilter, this._dexterityFilter, this._constitutionFilter, this._intelligenceFilter, this._wisdomFilter, this._charismaFilter],
			isAddDropdownToggle: true,
		});
		this._acFilter = new RangeFilter({header: "Armor Class", headerName: "護甲等級"});
		this._averageHpFilter = new RangeFilter({header: "Average Hit Points", headerName: "平均生命值"});
		this._typeFilter = new Filter({
			header: "Type",
			headerName: "生物類型",
			items: Parser.MON_TYPES,
			displayFn: Parser.monTypeToPlural,
			itemSortFn: SortUtil.ascSortLower,
		});
		this._tagFilter = new Filter({header: "Tag", headerName: "類型副標", displayFn: Parser.MonsterTagToDisplay});
		this._alignmentFilter = new Filter({
			header: "Alignment",
			headerName: "陣營",
			items: ["L", "NX", "C", "G", "NY", "E", "N", "U", "A", "No Alignment"],
			displayFn: alignment => Parser.alignmentAbvToFull(alignment).toTitleCase(),
			itemSortFn: null,
		});
		this._languageFilter = new Filter({
			header: "Languages",
			headerName: "語言",
			displayFn: (k) => Parser.LanguageToDisplay(Parser.monLanguageTagToFull(k)),
			umbrellaItems: ["X", "XX"],
			umbrellaExcludes: ["CS"],
		});
		this._damageTypeFilter = new Filter({
			header: "Damage Inflicted",
			headerName: "造成傷害",
			displayFn: (it) => Parser.dmgTypeToFull(it).toTitleCase(),
			items: Object.keys(Parser.DMGTYPE_JSON_TO_FULL),
		});
		this._conditionsInflictedFilterBase = new Filter({
			header: "By Traits/Actions",
			headerName: "通過特性/動作",
			displayFn: Parser.ConditionToDisplay,
			items: [...Parser.CONDITIONS],
		});
		this._conditionsInflictedFilterLegendary = new Filter({
			header: "通過巢穴動作/區域效應",
			displayFn: Parser.ConditionToDisplay,
			items: [...Parser.CONDITIONS],
		});
		this._conditionsInflictedFilterSpells = new Filter({
			header: "By Spells",
			headerName: "通過法術",
			displayFn: Parser.ConditionToDisplay,
			items: [...Parser.CONDITIONS],
		});
		this._conditionsInflictedFilter = new MultiFilter({header: "Conditions Inflicted", headerName: "造成狀態", filters: [this._conditionsInflictedFilterBase, this._conditionsInflictedFilterLegendary, this._conditionsInflictedFilterSpells]});
		this._senseFilter = new Filter({
			header: "Senses",
			headerName: "感官能力",
			displayFn: (it) => Parser.monSenseTagToFull(it).toTitleCase(),
			items: ["B", "D", "SD", "T", "U"],
			itemSortFn: SortUtil.ascSortLower,
		});
		this._skillFilter = new Filter({
			header: "Skills",
			displayFn: (it) => Parser.SkillToDisplay(it),
			headerName: "技能",
			items: Object.keys(Parser.SKILL_TO_ATB_ABV),
		});
		this._saveFilter = new Filter({
			header: "Saves",
			headerName: "豁免",
			displayFn: Parser.attAbvToFull,
			items: [...Parser.ABIL_ABVS],
			itemSortFn: null,
		});
		this._environmentFilter = new Filter({
			header: "Environment",
			headerName: "環境",
			items: ["arctic", "coastal", "desert", "forest", "grassland", "hill", "mountain", "swamp", "underdark", "underwater", "urban"],
			displayFn: Parser.EnvironmentToDisplay,
		});

		this._vulnerableFilter = new Filter({
			header: "Vulnerabilities",
			headerName: "易傷",
			items: PageFilterBestiary.DMG_TYPES,
			displayFn: (item) => `${Parser.DamageToDisplay(item)}易傷`,
		});
		this._resistFilter = new Filter({
			header: "Resistance",
			headerName: "抗性",
			items: PageFilterBestiary.DMG_TYPES,
			displayFn: (item) => `${Parser.DamageToDisplay(item)}抗性`,
		});
		this._immuneFilter = new Filter({
			header: "Immunity",
			headerName: "免疫",
			items: PageFilterBestiary.DMG_TYPES,
			displayFn: (item) => `${Parser.DamageToDisplay(item)}免疫`,
		});
		this._defenceFilter = new MultiFilter({header: "Damage", headerName: "傷害", filters: [this._vulnerableFilter, this._resistFilter, this._immuneFilter]});
		this._conditionImmuneFilter = new Filter({
			header: "Condition Immunity",
			headerName: "狀態免疫",
			items: PageFilterBestiary.CONDS,
			displayFn: Parser.ConditionToDisplay,
		});
		this._traitFilter = new Filter({
			header: "Traits",
			headerName: "特性",
			items: [
				"Aggressive", "Ambusher", "Amorphous", "Amphibious", "Antimagic Susceptibility", "Brute", "Charge", "Damage Absorption", "Death Burst", "Devil's Sight", "False Appearance", "Fey Ancestry", "Flyby", "Hold Breath", "Illumination", "Immutable Form", "Incorporeal Movement", "Keen Senses", "Legendary Resistances", "Light Sensitivity", "Magic Resistance", "Magic Weapons", "Pack Tactics", "Pounce", "Rampage", "Reckless", "Regeneration", "Rejuvenation", "Shapechanger", "Siege Monster", "Sneak Attack", "Spider Climb", "Sunlight Sensitivity", "Turn Immunity", "Turn Resistance", "Undead Fortitude", "Water Breathing", "Web Sense", "Web Walker",
			],
			displayFn: function (t) {
				switch (t) {
					case "Aggressive": return "侵略性";
					case "Ambusher": return "伏擊者";
					case "Amorphous": return "無定形";
					case "Amphibious": return "兩棲";
					case "Antimagic Susceptibility": return "反魔法敏感";
					case "Brute": return "殘暴";
					case "Charge": return "衝鋒";
					case "Damage Absorption": return "傷害吸收";
					case "Death Burst": return "死亡自爆";
					case "Devil's Sight": return "魔鬼視界";
					case "False Appearance": return "擬形";
					case "Fey Ancestry": return "精類血統";
					case "Flyby": return "飛掠";
					case "Hold Breath": return "屏息";
					case "Illumination": return "照明";
					case "Immutable Form": return "不變形態";
					case "Incorporeal Movement": return "虛體移動";
					case "Keen Senses": return "敏銳感官";
					case "Legendary Resistances": return "傳奇抗性";
					case "Light Sensitivity": return "光線敏感";
					case "Magic Resistance": return "魔法抗性";
					case "Magic Weapons": return "魔法武器";
					case "Pack Tactics": return "群體戰術";
					case "Pounce": return "猛撲";
					case "Reckless": return "魯莽";
					case "Regeneration": return "再生";
					case "Rejuvenation": return "復生";
					case "Rampage": return "暴走";
					case "Shapechanger": return "變形者";
					case "Siege Monster": return "攻城怪物";
					case "Sneak Attack": return "偷襲";
					case "Spider Climb": return "蛛行";
					case "Sunlight Sensitivity": return "日光敏感";
					case "Turn Immunity": return "驅散免疫";
					case "Turn Resistance": return "驅散抗性";
					case "Undead Fortitude": return "不死韌性";
					case "Water Breathing": return "水下呼吸";
					case "Web Sense": return "蛛網感知";
					case "Web Walker": return "蛛網行者";
					default: return t;
				}
			},
		});
		this._actionReactionFilter = new Filter({
			header: "Actions & Reactions",
			headerName: "動作&反應",
			items: [
				"Frightful Presence", "Multiattack", "Parry", "Swallow", "Teleport", "Tentacles",
			],
			displayFn: function (a) {
				switch (a) {
					case "Frightful Presence": return "駭人威儀";
					case "Multiattack": return "多重攻擊";
					case "Parry": return "格擋";
					case "Swallow": return "吞嚥";
					case "Teleport": return "傳送";
					case "Tentacles": return "觸手";
					default: return a;
				}
			},
		});
		this._miscFilter = new Filter({
			header: "Miscellaneous",
			headerName: "雜項",
			items: ["Familiar", ...Object.keys(Parser.MON_MISC_TAG_TO_FULL), "Bonus Actions", "Lair Actions", "Legendary", "Mythic", "Adventure NPC", "Spellcaster", ...Object.values(Parser.ATB_ABV_TO_FULL).map(it => `${PageFilterBestiary.MISC_FILTER_SPELLCASTER}${it}`), "Regional Effects", "Reactions", "Swarm", "Has Variants", "Modified Copy", "Has Alternate Token", "Has Info", "Has Images", "Has Token", "SRD", "AC from Item(s)", "AC from Natural Armor", "AC from Unarmored Defense"],
			displayFn: function (m) {
				switch (m) {
					case "Familiar": return "魔寵";
					case "Bonus Actions": return "附贈動作";
					case "Lair Actions": return "巢穴動作";
					case "Legendary": return "傳奇";
					case "Named NPC": return "具名NPC";
					case "Spellcaster": return "施法者";
					case "Spellcaster, 力量": return "施法者，力量";
					case "Spellcaster, 敏捷": return "施法者，敏捷";
					case "Spellcaster, 體質": return "施法者，體質";
					case "Spellcaster, 智力": return "施法者，智力";
					case "Spellcaster, 感知": return "施法者，感知";
					case "Spellcaster, 魅力": return "施法者，魅力";
					case "Regional Effects": return "區域效應";
					case "Swarm": return "集群";
					case "Has Variants": return "擁有變體";
					case "Has Images": return "擁有圖片";
					case "Has Info": return "擁有資訊";
					case "Has Token": return "擁有指示物";
					case "Has Alternate Token": return "擁有差分指示物";
					case "Reactions": return "反應";
					case "Adventure NPC": return "冒險NPC";
					case "AC from Unarmored Defense": return "無甲防禦";
					case "AC from Natural Armor": return "天生護甲";
					case "AC from Item(s)": return "物品提供AC";
					default: return m;
				}
			},
			deselFn: (it) => it === "Adventure NPC",
			itemSortFn: PageFilterBestiary.ascSortMiscFilter,
			isSrdFilter: true,
		});
		this._spellcastingTypeFilter = new Filter({
			header: "Spellcasting Type",
			headerName: "施法類型",
			items: ["F", "I", "P", "S", "CA", "CB", "CC", "CD", "CP", "CR", "CS", "CL", "CW"],
			displayFn: Parser.monSpellcastingTagToFull,
		});
	}

	static mutateForFilters (mon) {
		Renderer.monster.initParsed(mon);

		if (typeof mon.speed === "number" && mon.speed > 0) {
			mon._fSpeedType = ["walk"];
			mon._fSpeed = mon.speed;
		} else {
			mon._fSpeedType = Object.keys(mon.speed).filter(k => mon.speed[k]);
			if (mon._fSpeedType.length) mon._fSpeed = mon._fSpeedType.map(k => mon.speed[k].number || mon.speed[k]).filter(it => !isNaN(it)).sort((a, b) => SortUtil.ascSort(b, a))[0];
			else mon._fSpeed = 0;
			if (mon.speed.canHover) mon._fSpeedType.push("hover");
		}

		mon._fAc = mon.ac.map(it => it.special ? null : (it.ac || it)).filter(it => it !== null);
		if (!mon._fAc.length) mon._fAc = null;
		mon._fHp = mon.hp.average;
		if (mon.alignment) {
			const tempAlign = typeof mon.alignment[0] === "object"
				? Array.prototype.concat.apply([], mon.alignment.map(a => a.alignment))
				: [...mon.alignment];
			if (tempAlign.includes("N") && !tempAlign.includes("G") && !tempAlign.includes("E")) tempAlign.push("NY");
			else if (tempAlign.includes("N") && !tempAlign.includes("L") && !tempAlign.includes("C")) tempAlign.push("NX");
			else if (tempAlign.length === 1 && tempAlign.includes("N")) Array.prototype.push.apply(tempAlign, PageFilterBestiary._NEUT_ALIGNS);
			mon._fAlign = tempAlign;
		} else {
			mon._fAlign = ["No Alignment"];
		}
		mon._fVuln = mon.vulnerable ? PageFilterBestiary.getAllImmRest(mon.vulnerable, "vulnerable") : [];
		mon._fRes = mon.resist ? PageFilterBestiary.getAllImmRest(mon.resist, "resist") : [];
		mon._fImm = mon.immune ? PageFilterBestiary.getAllImmRest(mon.immune, "immune") : [];
		mon._fCondImm = mon.conditionImmune ? PageFilterBestiary.getAllImmRest(mon.conditionImmune, "conditionImmune") : [];
		mon._fSave = mon.save ? Object.keys(mon.save) : [];
		mon._fSkill = mon.skill ? Object.keys(mon.skill) : [];
		mon._fSources = SourceFilter.getCompleteFilterSources(mon);

		mon._fMisc = mon.legendary ? ["Legendary"] : [];
		if (mon.familiar) mon._fMisc.push("Familiar");
		if (mon.type.swarmSize) mon._fMisc.push("Swarm");
		if (mon.spellcasting) {
			mon._fMisc.push("Spellcaster");
			mon.spellcasting.forEach(sc => {
				if (sc.ability) mon._fMisc.push(`${PageFilterBestiary.MISC_FILTER_SPELLCASTER}${Parser.attAbvToFull(sc.ability)}`);
			});
		}
		if (mon.isNpc) mon._fMisc.push("Adventure NPC");
		const legGroup = DataUtil.monster.getMetaGroup(mon);
		if (legGroup) {
			if (legGroup.lairActions) mon._fMisc.push("Lair Actions");
			if (legGroup.regionalEffects) mon._fMisc.push("Regional Effects");
		}
		if (mon.reaction) mon._fMisc.push("Reactions");
		if (mon.bonus) mon._fMisc.push("Bonus Actions");
		if (mon.variant) mon._fMisc.push("Has Variants");
		if (mon.miscTags) mon._fMisc.push(...mon.miscTags);
		if (mon._isCopy) mon._fMisc.push("Modified Copy");
		if (mon.altArt) mon._fMisc.push("Has Alternate Token");
		if (mon.srd) mon._fMisc.push("SRD");
		if (mon.tokenUrl || mon.hasToken) mon._fMisc.push("Has Token");
		if (mon.mythic) mon._fMisc.push("Mythic");
		if (mon.hasFluff) mon._fMisc.push("Has Info");
		if (mon.hasFluffImages) mon._fMisc.push("Has Images");
		(mon.ac || []).forEach(it => {
			if (!it.from) return;
			if (it.from.includes("natural armor") || it.from.includes("天生護甲")) mon._fMisc.push("AC from Natural Armor");
			if (it.from.some(x => x.startsWith("{@item "))) mon._fMisc.push("AC from Item(s)");
			if (it.from.includes("Unarmored Defense") || it.from.includes("無甲防禦")) mon._fMisc.push("AC from Unarmored Defense");
		});
	}

	addToFilters (mon, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(mon._fSources);
		this._crFilter.addItem(mon._pCr);
		this._strengthFilter.addItem(mon.str);
		this._dexterityFilter.addItem(mon.dex);
		this._constitutionFilter.addItem(mon.con);
		this._intelligenceFilter.addItem(mon.int);
		this._wisdomFilter.addItem(mon.wis);
		this._charismaFilter.addItem(mon.cha);
		this._speedFilter.addItem(mon._fSpeed);
		mon.ac.forEach(it => this._acFilter.addItem(it.ac || it));
		if (mon.hp.average) this._averageHpFilter.addItem(mon.hp.average);
		this._tagFilter.addItem(mon._pTypes.tags);
		this._traitFilter.addItem(mon.traitTags);
		this._actionReactionFilter.addItem(mon.actionTags);
		this._environmentFilter.addItem(mon.environment);
		this._vulnerableFilter.addItem(mon._fVuln);
		this._resistFilter.addItem(mon._fRes);
		this._immuneFilter.addItem(mon._fImm);
		this._senseFilter.addItem(mon.senseTags);
	}

	async _pPopulateBoxOptions (opts) {
		Object.entries(Parser.MON_LANGUAGE_TAG_TO_FULL)
			.sort(([kA, vA], [kB, vB]) => SortUtil.ascSortLower(vA, vB))
			.forEach(([k]) => this._languageFilter.addItem(k));

		opts.filters = [
			this._sourceFilter,
			this._crFilter,
			this._typeFilter,
			this._tagFilter,
			this._environmentFilter,
			this._defenceFilter,
			this._conditionImmuneFilter,
			this._traitFilter,
			this._actionReactionFilter,
			this._miscFilter,
			this._spellcastingTypeFilter,
			this._sizeFilter,
			this._speedFilter,
			this._speedTypeFilter,
			this._alignmentFilter,
			this._saveFilter,
			this._skillFilter,
			this._senseFilter,
			this._languageFilter,
			this._damageTypeFilter,
			this._conditionsInflictedFilter,
			this._acFilter,
			this._averageHpFilter,
			this._abilityScoreFilter,
		];
	}

	toDisplay (values, m) {
		return this._filterBox.toDisplay(
			values,
			m._fSources,
			m._fCr,
			m._pTypes.type,
			m._pTypes.tags,
			m.environment,
			[
				m._fVuln,
				m._fRes,
				m._fImm,
			],
			m._fCondImm,
			m.traitTags,
			m.actionTags,
			m._fMisc,
			m.spellcastingTags,
			m.size,
			m._fSpeed,
			m._fSpeedType,
			m._fAlign,
			m._fSave,
			m._fSkill,
			m.senseTags,
			m.languageTags,
			m.damageTags,
			[
				m.conditionInflict,
				m.conditionInflictLegendary,
				m.conditionInflictSpell,
			],
			m._fAc,
			m._fHp,
			[
				m.str,
				m.dex,
				m.con,
				m.int,
				m.wis,
				m.cha,
			],
		);
	}
}
PageFilterBestiary._NEUT_ALIGNS = ["NX", "NY"];
PageFilterBestiary.MISC_FILTER_SPELLCASTER = "Spellcaster, ";
PageFilterBestiary.DMG_TYPES = [...Parser.DMG_TYPES];
PageFilterBestiary.CONDS = [
	"blinded",
	"charmed",
	"deafened",
	"exhaustion",
	"frightened",
	"grappled",
	"incapacitated",
	"invisible",
	"paralyzed",
	"petrified",
	"poisoned",
	"prone",
	"restrained",
	"stunned",
	"unconscious",
	// not really a condition, but whatever
	"disease",
];

class ModalFilterBestiary extends ModalFilter {
	/**
	 * @param opts
	 * @param opts.namespace
	 * @param [opts.isRadio]
	 * @param [opts.allData]
	 */
	constructor (opts) {
		opts = opts || {};
		super({
			...opts,
			modalTitle: `Creature${opts.isRadio ? "" : "s"}`,
			pageFilter: new PageFilterBestiary(),
			fnSort: PageFilterBestiary.sortMonsters,
		})
	}

	_$getColumnHeaders () {
		const btnMeta = [
			{sort: "name", text: "Name", width: "4"},
			{sort: "type", text: "Type", width: "4"},
			{sort: "cr", text: "CR", width: "2"},
			{sort: "source", text: "Source", width: "1"},
		];
		return ModalFilter._$getFilterColumnHeaders(btnMeta);
	}

	async _pLoadAllData () {
		const brew = await BrewUtil.pAddBrewData();
		const fromData = await DataUtil.monster.pLoadAll();
		const fromBrew = brew.monster || [];
		return [...fromData, ...fromBrew];
	}

	_getListItem (pageFilter, mon, itI) {
		Renderer.monster.initParsed(mon);
		pageFilter.mutateAndAddToFilters(mon);

		const eleRow = document.createElement("div");
		eleRow.className = "px-0 w-100 flex-col no-shrink";

		const hash = UrlUtil.URL_TO_HASH_BUILDER[UrlUtil.PG_BESTIARY](mon);
		const source = Parser.sourceJsonToAbv(mon.source);
		const type = mon._pTypes.asText.uppercaseFirst();
		const cr = mon._pCr;

		eleRow.innerHTML = `<div class="w-100 flex-vh-center lst--border no-select lst__wrp-cells">
			<div class="col-0-5 pl-0 flex-vh-center">${this._isRadio ? `<input type="radio" name="radio" class="no-events">` : `<input type="checkbox" class="no-events">`}</div>

			<div class="col-0-5 px-1 flex-vh-center">
				<div class="ui-list__btn-inline px-2" title="Toggle Preview">[+]</div>
			</div>

			<div class="col-4 ${this._getNameStyle()}">${mon.name}</div>
			<div class="col-4">${type}</div>
			<div class="col-2 text-center">${cr}</div>
			<div class="col-1 text-center ${Parser.sourceJsonToColor(mon.source)} pr-0" title="${Parser.sourceJsonToFull(mon.source)}" ${BrewUtil.sourceJsonToStyle(mon.source)}>${source}</div>
		</div>`;

		const btnShowHidePreview = eleRow.firstElementChild.children[1].firstElementChild;

		const listItem = new ListItem(
			itI,
			eleRow,
			mon.name,
			{
				hash,
				source,
				sourceJson: mon.source,
				type,
				cr,
				ENG_name: mon.ENG_name,
				ENG_hash: UrlUtil.autoEncodeEngHash(mon),
			},
			{
				cbSel: eleRow.firstElementChild.firstElementChild.firstElementChild,
				btnShowHidePreview,
			},
		);

		ListUiUtil.bindPreviewButton(UrlUtil.PG_BESTIARY, this._allData, listItem, btnShowHidePreview);

		return listItem;
	}
}
