"use strict";

const RNG = RollerUtil.randomise;

// usage: _testRng(() => GenUtil.getFromTable(PARENTS_TIEFLING, RNG(8)))
function _testRng (rollFn) {
	const counts = {};
	for (let i = 0; i < 10000; ++i) {
		const roll = rollFn();
		const it = roll.display || roll.result;
		if (!counts[it]) counts[it] = 1;
		else counts[it]++;
	}
	return counts;
}

function rollSuppAlignment () {
	return GenUtil.getFromTable(SUPP_ALIGNMENT, RNG(6) + RNG(6) + RNG(6));
}
function rollSuppDeath () {
	return GenUtil.getFromTable(SUPP_DEATH, RNG(12));
}
function rollSuppClass () {
	return GenUtil.getFromTable(SUPP_CLASS, RNG(100));
}
function rollSuppOccupation () {
	return GenUtil.getFromTable(SUPP_OCCUPATION, RNG(100));
}
function rollSuppRace () {
	return GenUtil.getFromTable(SUPP_RACE, RNG(100));
}
function rollSuppRelationship () {
	return GenUtil.getFromTable(SUPP_RELATIONSHIP, RNG(4) + RNG(4) + RNG(4));
}
function rollSuppStatus () {
	return GenUtil.getFromTable(SUPP_STATUS, RNG(6) + RNG(6) + RNG(6));
}

/**
 * @param [opts] Options object.
 * @param [opts.isParent] If this person is a parent.
 * @param [opts.race] Race for this person (parent only).
 * @param [opts.gender] Gender for this person (parent only).
 * @param [opts.isSibling] If this person is a sibling.
 * @param opts.gender The gender of this person.
 * @param opts.parentRaces List of parent races for this person.
 * @param opts.isAdventurer Is the person is an adventurer (and therefore has a class as opposed to an occupation).
 */
function getPersonDetails (opts) {
	opts = opts || {};

	function addName (race, gender) {
		const raceSlug = Parser.stringToSlug(race);
		if (nameTables[raceSlug]) {
			const availNameTables = nameTables[raceSlug];

			const maleFirstTables = [];
			const femaleFirstTables = [];
			const surnameTables = [];

			availNameTables.tables.forEach(tbl => {
				const nameParts = tbl.option.replace(/,/g, " ").toLowerCase().split(/\s+/);
				if (nameParts.includes("male")) maleFirstTables.push(tbl);
				else if (nameParts.includes("female")) femaleFirstTables.push(tbl);
				else if (!nameParts.includes("child")) surnameTables.push(tbl);
			});

			const chooseFrom = gender === "Other"
				? maleFirstTables.concat(femaleFirstTables)
				: gender === "Male" ? maleFirstTables : femaleFirstTables;
			const nameTableMeta = rollOnArray(chooseFrom);
			const resultFirst = GenUtil.getFromTable(nameTableMeta.table, RNG(nameTableMeta.diceType));
			const resultLast = (() => {
				if (surnameTables.length) {
					const nameTableMeta = rollOnArray(chooseFrom);
					return GenUtil.getFromTable(nameTableMeta.table, RNG(nameTableMeta.diceType));
				} else return null;
			})();

			if (opts.isParent && !ptrParentLastName._) ptrParentLastName._ = resultLast ? resultLast.result : null;
			const lastName = (() => {
				if (ptrParentLastName._) {
					if (opts.isParent) return ptrParentLastName._;
					else if (opts.isSibling) {
						// 20% chance of sibling not having the same last name
						if (RNG(5) !== 5) return ptrParentLastName._;
					}
				}
				return resultLast ? resultLast.result : "";
			})();

			out.unshift(`<i><b title="使用姍娜薩的萬事指南中的隨機姓名表生成">名字：</b> ${resultFirst.result}${lastName ? ` ${lastName}` : ""}</i>`);
		}
	}

	const status = rollSuppStatus();
	const align = rollSuppAlignment().result;
	const occ = rollSuppOccupation().result;
	const cls = rollSuppClass().result;
	const relate = rollSuppRelationship().result;
	const out = [
		`<b>陣營：</b> ${align}`,
		opts.isAdventurer ? `<b>工作職業：</b> ${cls}` : `<b>職業：</b> ${occ}`,
		`<b>關係：</b> ${relate}`,
	];
	if (!opts.isParent) {
		out.push(`<b>狀態：</b> ${status.result}`);
	}

	if (!opts.isParent) {
		const race = opts.parentRaces ? (() => {
			const useParent = RNG(100) > 15;
			if (useParent) return rollOnArray(opts.parentRaces);
			else return rollSuppRace().result;
		})() : rollSuppRace().result;

		out.unshift(`<i><b>種族：</b> ${race}</i>`);
		const gender = opts.gender ? opts.gender : rollUnofficialGender().result;
		out.unshift(`<i><b>性別：</b> ${gender}</i>`);

		addName(race, gender);
	} else if (opts.race) {
		addName(opts.race, opts.gender || "其他");
	}
	return out;
}

function rollEvtAdventure () {
	return GenUtil.getFromTable(LIFE_EVENTS_ADVENTURES, RNG(100));
}
function rollEvtArcaneMatter () {
	return GenUtil.getFromTable(LIFE_EVENTS_ARCANE_MATTERS, RNG(10));
}
function rollEvtBoon () {
	return GenUtil.getFromTable(LIFE_EVENTS_BOONS, RNG(10));
}
function rollEvtCrime () {
	return GenUtil.getFromTable(LIFE_EVENTS_CRIME, RNG(8));
}
function rollEvtPunishment () {
	return GenUtil.getFromTable(LIFE_EVENTS_PUNISHMENT, RNG(12));
}
function rollEvtSupernatural () {
	return GenUtil.getFromTable(LIFE_EVENTS_SUPERNATURAL, RNG(100));
}
function rollEvtTragedy () {
	return GenUtil.getFromTable(LIFE_EVENTS_TRAGEDIES, RNG(12));
}
function rollEvtWar () {
	return GenUtil.getFromTable(LIFE_EVENTS_WAR, RNG(12));
}
function rollEvtWeird () {
	return GenUtil.getFromTable(LIFE_EVENTS_WEIRD_STUFF, RNG(12));
}

function rollUnofficialGender () {
	const GENDERS = [
		{min: 1, max: 49, result: "Male"},
		{min: 50, max: 98, result: "Female"},
		{min: 98, max: 100, result: "Other"},
	];
	return GenUtil.getFromTable(GENDERS, RNG(100));
}

function choose (...lst) {
	return fmtChoice(rollOnArray(lst));
}

function chooseRender (...lst) {
	return fmtChoice(rollOnArray(lst), true);
}

function fmtChoice (str, render) {
	const raw = `({@i ${str}})`;
	return render ? Renderer.get().render(raw) : raw;
}

function rollOnArray (lst) {
	return lst[RNG(lst.length) - 1]
}

const RACES_SELECTABLE = ["Dwarf", "Elf", "Half-Elf", "Half-Orc", "Tiefling"];
const RACES_UNSELECTABLE = ["Human", "Halfling", "Dragonborn", "Gnome"];

const PARENTS_HALF_ELF = [
	{min: 1, max: 5, result: () => { const p = RNG(2); return `父母其中一方是精靈 ${fmtChoice(p === 1 ? "母親" : "父親")}，另一方是人類 ${fmtChoice(p === 1 ? "父親" : "母親")}。` }, display: "父母其中一方是精靈，另一方是人類。", _races: ["Elf", "Human"]},
	{min: 6, result: () => { const p = RNG(2); return `父母其中一方是精靈 ${fmtChoice(p === 1 ? "母親" : "父親")}，另一方是半精靈 ${fmtChoice(p === 1 ? "父親" : "母親")}。` }, display: "父母其中一方是精靈，另一方是半精靈。", _races: ["Elf", "Half-Elf"]},
	{min: 7, result: () => { const p = RNG(2); return `父母其中一方是人類 ${fmtChoice(p === 1 ? "母親" : "父親")}，另一方是半精靈 ${fmtChoice(p === 1 ? "父親" : "母親")}。` }, display: "父母其中一方是人類，另一方是半精靈。", _races: ["Half-Elf", "Human"]},
	{min: 8, result: "雙親都是半精靈。"},
];

const PARENTS_HALF_ORC = [
	{min: 1, max: 3, result: () => { const p = RNG(2); return `父母其中一方是獸人 ${fmtChoice(p === 1 ? "母親" : "父親")}，另一方是人類 ${fmtChoice(p === 1 ? "父親" : "母親")}。` }, display: "父母其中一方是獸人，另一方是人類。", _races: ["Orc", "Human"]},
	{min: 4, max: 5, result: () => { const p = RNG(2); return `父母其中一方是獸人 ${fmtChoice(p === 1 ? "母親" : "父親")}，另一方是半獸人 ${fmtChoice(p === 1 ? "父親" : "母親")}。` }, display: "父母其中一方是獸人，另一方是半獸人。", _races: ["Orc", "Half-Orc"]},
	{min: 6, max: 7, result: () => { const p = RNG(2); return `父母其中一方是人類 ${fmtChoice(p === 1 ? "母親" : "父親")}，另一方是半獸人 ${fmtChoice(p === 1 ? "父親" : "母親")}。` }, display: "父母其中一方是人類，另一方是半獸人。", _races: ["Human", "Half-Orc"]},
	{min: 8, display: "雙親都是半獸人。"},
];

const PARENTS_TIEFLING = [
	{min: 1, max: 4, display: "雙親都是人類，他們體內沉睡的煉獄血脈在你身上顯現。"},
	{min: 5, max: 6, result: () => { const p = RNG(2); return `父母其中一方是提夫林 ${fmtChoice(p === 1 ? "母親" : "父親")}，另一方是人類 ${fmtChoice(p === 1 ? "父親" : "母親")}。` }, display: "父母其中一方是提夫林，另一方是人類。", _races: ["Human", "Tiefling"]},
	{min: 7, result: () => { const p = RNG(2); return `父母其中一方是提夫林 ${fmtChoice(p === 1 ? "母親" : "父親")}，另一方是魔鬼 ${fmtChoice(p === 1 ? "父親" : "母親")}。` }, display: "父母其中一方是提夫林，另一方是魔鬼。", _races: ["Devil", "Tiefling"]},
	{min: 8, result: () => { const p = RNG(2); return `父母其中一方是人類 ${fmtChoice(p === 1 ? "母親" : "父親")}，另一方是魔鬼 ${fmtChoice(p === 1 ? "父親" : "母親")}。` }, display: "父母其中一方是人類，另一方是魔鬼。", _races: ["Human", "Devil"]},
];

const BIRTHPLACES = [
	{min: 1, max: 50, result: "家中"},
	{min: 51, max: 55, result: "家族友人的家中"},
	{min: 56, max: 63, result: () => `醫者或產婆的家中 ${choose("醫者", "產婆")}`, display: "醫者或產婆的家中"},
	{min: 64, max: 65, result: () => `四輪馬車、運貨車、或運貨馬車 ${choose("四輪馬車", "運貨車", "運貨馬車")}`, display: "四輪馬車、運貨車、或運貨馬車"},
	{min: 66, max: 68, result: () => `穀倉、牲舍、或其他附屬建築 ${choose("穀倉", "牲舍", "附屬建築")}`, display: "穀倉、牲舍、或其他附屬建築"},
	{min: 69, max: 70, result: "洞穴"},
	{min: 71, max: 72, result: "原野"},
	{min: 73, max: 74, result: "森林"},
	{min: 75, max: 77, result: "神廟"},
	{min: 78, result: "戰場"},
	{min: 79, max: 80, result: () => `巷弄或街道 ${choose("巷弄", "街道")}`, display: "巷弄或街道"},
	{min: 81, max: 82, result: () => `妓院、酒館、或旅店 ${choose("妓院", "酒館", "旅店")}`, display: "妓院、酒館、或旅店"},
	{min: 83, max: 84, result: () => `城堡、要塞、高塔、或宮殿 ${choose("城堡", "要塞", "高塔", "宮殿")}`, display: "城堡、要塞、高塔、或宮殿"},
	{min: 85, result: () => `下水道或垃圾堆 ${choose("下水道", "垃圾堆")}`, display: "下水道或垃圾堆"},
	{min: 86, max: 88, result: "在不同種族的人群之中"},
	{min: 89, max: 91, result: () => `在舟艇或船艦上 ${choose("舟艇", "船艦")}`, display: "在舟艇或船艦上"},
	{min: 92, max: 93, result: () => `在監獄或一個秘密組織的總部中 ${choose("監獄", "秘密組織的總部")}`, display: "在監獄或一個秘密組織的總部中"},
	{min: 94, max: 95, result: "在一名學者的研究室"},
	{min: 96, result: "在妖精荒野"},
	{min: 97, result: "在墮影冥界"},
	{min: 98, result: () => `在星界位面或乙太位面 ${choose("星界位面", "乙太位面")}`, display: "在星界位面或乙太位面"},
	{min: 99, result: "在一個你所選擇的內層位面"},
	{min: 100, result: "在一個你所選擇的外層位面"},
];

function absentParent (parent) {
	return GenUtil.getFromTable(ABSENT_PARENT, RNG(4)).result.replace("父母", `$& ${fmtChoice(parent)}</i>`);
}

function absentBothParents () {
	const p = ["母親", "父親"][RNG(2) - 1];
	return `${absentParent(p)} ${absentParent(otherParent(p))}`;
}

function otherParent (parent) {
	return parent === "母親" ? "父親" : "母親";
}

function singleParentOrStep (parent) {
	const p = RNG(2);
	return `單親${parent} 或 繼${parent} ${fmtChoice(p === 1 ? parent : `繼${parent}`)}. ${p === 1 ? `${absentParent(otherParent(parent))}` : absentBothParents()}`
}

const FAMILY = [
	{min: 1, result: () => `無。 ${absentBothParents()}`, display: "無"},
	{min: 2, result: () => `公共機構，例如收容所。 ${absentBothParents()}`, display: "公共機構，例如收容所"},
	{min: 3, result: () => `神殿。 ${absentBothParents()}`, display: "神殿"},
	{min: 4, max: 5, result: () => `孤兒院。 ${absentBothParents()}`, display: "孤兒院"},
	{min: 6, max: 7, result: () => `監護人。 ${absentBothParents()}`, display: "監護人"},
	{min: 8, max: 15, result: () => `父親或母親家族的姨母或叔父，或者兩者皆具；或者是如同部落或氏族的大家族 ${choose("叔父", "姨母", "叔父和姨母", "如同部落或氏族的大家族")}. ${absentBothParents()}`, display: "父親或母親家族的姨母或叔父，或者兩者皆具；或者是如同部落或氏族的大家族"},
	{min: 16, max: 25, result: () => `祖父母或外祖父母 ${choose("祖父", "外祖母", "祖父和外祖母")}. ${absentBothParents()}`, display: "祖父母或外祖父母"},
	{min: 26, max: 35, result: () => `領養家庭 (相同或不同種族) ${choose("相同種族", "不同種族")}. ${absentBothParents()}`, display: "領養家庭 (相同或不同種族)"},
	{min: 36, max: 55, result: () => singleParentOrStep("父親"), display: "單親父親 或 繼父"},
	{min: 56, max: 75, result: () => singleParentOrStep("母親"), display: "單親母親 或 繼母"},
	{min: 76, max: 100, result: "父母親"},
];

const ABSENT_PARENT = [
	{min: 1, result: () => `你父母雙亡 (${rollSuppDeath().result.lowercaseFirst()})。`, display: "你父母雙亡（使用{@table Supplemental Tables; Cause of Death|XGE|死因}補充表擲骰）。"},
	{min: 2, result: () => `你的父母被監禁、奴役、或因為其他原因而被帶走 ${choose("監禁", "奴役", "其他原因")}。`, display: "你的父母被監禁、奴役、或因為其他原因而被帶走。"},
	{min: 3, result: "你的父母遺棄了你。"},
	{min: 4, result: "你的父母不知去向。"},
];

const FAMILY_LIFESTYLE = [
	{min: 3, result: "悲慘 (-40)", "modifier": -40},
	{min: 4, max: 5, result: "困苦 (-20)", "modifier": -20},
	{min: 6, max: 8, result: "貧窮 (-10)", "modifier": -10},
	{min: 9, max: 12, result: "簡樸 (+0)", "modifier": 0},
	{min: 13, max: 15, result: "舒適 (+10)", "modifier": 10},
	{min: 16, max: 17, result: "富裕 (+20)", "modifier": 20},
	{min: 18, result: "奢華 (+40)", "modifier": 40},
];

const CHILDHOOD_HOME = [
	{min: 0, result: "On the streets"},
	{min: 1, max: 20, result: "Rundown shack"},
	{min: 21, max: 30, result: "No permanent residence; you moved around a lot"},
	{min: 31, max: 40, result: () => `Encampment or village ${choose("encampment", "village")} in the wilderness`, display: "Encampment or village in the wilderness"},
	{min: 41, max: 50, result: "Apartment in a rundown neighborhood"},
	{min: 51, max: 70, result: "Small house"},
	{min: 71, max: 90, result: "Large house"},
	{min: 91, max: 110, result: "豪宅"},
	{min: 111, result: () => `宮殿或城堡 ${choose("宮殿", "城堡")}`, display: "宮殿或城堡"},
];

const CHILDHOOD_MEMORIES = [
	{min: 3, result: "I am still haunted by my childhood, when I was treated badly by my peers."},
	{min: 4, max: 5, result: "I spent most of my childhood alone, with no close friends."},
	{min: 6, max: 8, result: "Others saw me as being different or strange, and so I had few companions."},
	{min: 9, max: 12, result: "I had a few close friends and lived an ordinary childhood."},
	{min: 13, max: 15, result: "I had several friends, and my childhood was generally a happy one."},
	{min: 16, max: 17, result: "I always found it easy to make friends, and I loved being around people."},
	{min: 18, result: "Everyone knew who I was, and I had friends everywhere I went."},
];

const LIFE_EVENTS_AGE = [
	{min: 1, max: 20, "age": () => RNG(20), result: "20歲或更年輕", "events": 1},
	{min: 21, max: 59, "age": () => RNG(10) + 20, result: "21\u201430歲", "events": () => RNG(4)},
	{min: 60, max: 69, "age": () => RNG(10) + 30, result: "31\u201440歲", "events": () => RNG(6)},
	{min: 70, max: 89, "age": () => RNG(10) + 40, result: "41\u201450歲", "events": () => RNG(8)},
	{min: 90, max: 99, "age": () => RNG(10) + 50, result: "51\u201460歲", "events": () => RNG(10)},
	{min: 100, "age": () => RNG(690) + 60, result: "61歲或更老", "events": () => RNG(12)}, // max age = 750; max elven age
];

function _lifeEvtResult (title, rollResult) {
	const out = {
		result: `${title}: ${rollResult.result}`,
	};
	if (rollResult.nextRoll) out.nextRoll = rollResult.nextRoll;
	return out;
}

function _lifeEvtResultArr (title, titles, ...rollResults) {
	return {
		title: title,
		result: titles.map((it, i) => `${it}: ${rollResults[i].result}`),
	}
}

let marriageIndex = 0;
function _lifeEvtPerson (title, personDetails) {
	return {
		title: title,
		result: personDetails,
	}
}

const LIFE_EVENTS = [
	{min: 1, max: 10, result: "You suffered a tragedy. Roll on the Tragedies table.", nextRoll: () => _lifeEvtResult("Tragedy", rollEvtTragedy())},
	{min: 11, max: 20, result: "You gained a bit of good fortune. Roll on the Boons table.", nextRoll: () => _lifeEvtResult("Boon", rollEvtBoon())},
	{min: 21, max: 30, result: "You fell in love or got married. If you get this result more than once, you can choose to have a child instead. Work with your DM to determine the identity of your love interest.", nextRoll: () => _lifeEvtPerson(marriageIndex++ === 0 ? "Spouse" : "Spouse/Child", getPersonDetails())},
	{min: 31, max: 40, result: () => `You made an enemy of an adventurer. Roll a {@dice d6} ${fmtChoice(RNG(6))}. An odd number indicates you are to blame for the rift, and an even number indicates you are blameless. Use the supplemental tables and work with your DM to determine this hostile character's identity and the danger this enemy poses to you.`, display: "You made an enemy of an adventurer. Roll a {@dice d6}. An odd number indicates you are to blame for the rift, and an even number indicates you are blameless. Use the supplemental tables and work with your DM to determine this hostile character's identity and the danger this enemy poses to you.", nextRoll: () => _lifeEvtPerson("Enemy", getPersonDetails({isAdventurer: true}))},
	{min: 41, max: 50, result: "You made a friend of an adventurer. Use the supplemental tables and work with your DM to add more detail to this friendly character and establish how your friendship began.", nextRoll: () => _lifeEvtPerson("Friend", getPersonDetails({isAdventurer: true}))},
	{min: 51, max: 70, result: () => `You spent time working in a job related to your background. Start the game with an extra {@dice 2d6} ${fmtChoice(RNG(6) + RNG(6))} gp.`, display: "You spent time working in a job related to your background. Start the game with an extra {@dice 2d6} gp."},
	{min: 71, max: 75, result: "You met someone important. Use the supplemental tables to determine this character's identity and how this individual feels about you. Work out additional details with your DM as needed to fit this character into your backstory.", nextRoll: () => _lifeEvtPerson("Meeting", getPersonDetails())},
	{min: 76, max: 80, result: "You went on an adventure. Roll on the Adventures table to see what happened to you. Work with your DM to determine the nature of the adventure and the creatures you encountered.", nextRoll: () => _lifeEvtResult("Adventure", rollEvtAdventure())},
	{min: 81, max: 85, result: "You had a supernatural experience. Roll on the Supernatural Events table to find out what it was.", nextRoll: () => _lifeEvtResult("Supernatural Experience", rollEvtSupernatural())},
	{min: 86, max: 90, result: "You fought in a battle. Roll on the War table to learn what happened to you. Work with your DM to come up with the reason for the battle and the factions involved. It might have been a small conflict between your community and a band of orcs, or it could have been a major battle in a larger war.", nextRoll: () => _lifeEvtResult("War", rollEvtWar())},
	{min: 91, max: 95, result: "You committed a crime or were wrongly accused of doing so. Roll on the Crime table to determine the nature of the offense and on the Punishment table to see what became of you.", nextRoll: () => _lifeEvtResultArr("Crime and Punishment", ["Crime", "Punishment"], rollEvtCrime(), rollEvtPunishment())},
	{min: 96, max: 99, result: "You encountered something magical. Roll on the Arcane Matters table.", nextRoll: () => _lifeEvtResult("Arcane Matter", rollEvtArcaneMatter())},
	{min: 100, result: "Something truly strange happened to you. Roll on the Weird Stuff table.", nextRoll: () => _lifeEvtResult("Weird Stuff", rollEvtWeird())},
];

const LIFE_EVENTS_ADVENTURES = [
	{min: 1, max: 10, result: () => `You nearly died. You have nasty scars on your body, and you are missing an ear, {@dice 1d3} ${fmtChoice(RNG(3))} fingers, or {@dice 1d4} ${fmtChoice(RNG(4))} toes.`, display: "You nearly died. You have nasty scars on your body, and you are missing an ear, {@dice 1d3} fingers, or {@dice 1d4} toes."},
	{min: 11, max: 20, result: "You suffered a grievous injury. Although the wound healed, it still pains you from time to time."},
	{min: 21, max: 30, result: "You were wounded, but in time you fully recovered."},
	{min: 31, max: 40, result: "You contracted a disease while exploring a filthy warren. You recovered from the disease, but you have a persistent cough, pockmarks on your skin, or prematurely gray hair."},
	{min: 41, max: 50, result: "You were poisoned by a trap or a monster. You recovered, but the next time you must make a saving throw against poison, you make the saving throw with disadvantage."},
	{min: 51, max: 60, result: "You lost something of sentimental value to you during your adventure. Remove one trinket from your possessions."},
	{min: 61, max: 70, result: "You were terribly frightened by something you encountered and ran away, abandoning your companions to their fate."},
	{min: 71, max: 80, result: "You learned a great deal during your adventure. The next time you make an ability check or a saving throw, you have advantage on the roll."},
	{min: 81, max: 90, result: () => `You found some treasure on your adventure. You have {@dice 2d6} ${fmtChoice(RNG(6) + RNG(6))} gp left from your share of it.`, display: "You found some treasure on your adventure. You have {@dice 2d6} gp left from your share of it."},
	{min: 91, max: 99, result: () => `You found a considerable amount of treasure on your adventure. You have {@dice 1d20 + 50} ${fmtChoice(RNG(20) + 50)} gp left from your share of it.`, display: "You found a considerable amount of treasure on your adventure. You have {@dice 1d20 + 50} gp left from your share of it."},
	{min: 100, result: "You came across a common magic item (of the DM's choice)."},
];

const LIFE_EVENTS_ARCANE_MATTERS = [
	{min: 1, result: "You were charmed or frightened by a spell."},
	{min: 2, result: "You were injured by the effect of a spell."},
	{min: 3, result: "You witnessed a powerful spell being cast by a cleric, a druid, a sorcerer, a warlock, or a wizard."},
	{min: 4, result: "You drank a potion (of the DM's choice)."},
	{min: 5, result: "You found a spell scroll (of the DM's choice) and succeeded in casting the spell it contained."},
	{min: 6, result: "You were affected by teleportation magic."},
	{min: 7, result: "You turned invisible for a time."},
	{min: 8, result: "You identified an illusion for what it was."},
	{min: 9, result: "You saw a creature being conjured by magic."},
	{min: 10, result: () => `Your fortune was read by a diviner. Roll twice on the Life Events table, but don't apply the results. Instead, the DM picks one event as a portent of your future (which might or might not come true). ${fmtChoice(GenUtil.getFromTable(LIFE_EVENTS, RNG(100)).display || GenUtil.getFromTable(LIFE_EVENTS, RNG(100)).result)} ${fmtChoice(GenUtil.getFromTable(LIFE_EVENTS, RNG(100)).display || GenUtil.getFromTable(LIFE_EVENTS, RNG(100)).result)}`, display: "Your fortune was read by a diviner. Roll twice on the Life Events table, but don't apply the results. Instead, the DM picks one event as a portent of your future (which might or might not come true)."},
];

const LIFE_EVENTS_BOONS = [
	{min: 1, result: "A friendly wizard gave you a spell scroll containing one cantrip (of the DM's choice)."},
	{min: 2, result: "You saved the life of a commoner, who now owes you a life debt. This individual accompanies you on your travels and performs mundane tasks for you, but will leave if neglected, abused, or imperiled. Determine details about this character by using the supplemental tables and working with your DM."},
	{min: 3, result: "You found a {@item riding horse}."},
	{min: 4, result: () => `You found some money. You have {@dice 1d20} ${fmtChoice(RNG(20))} gp in addition to your regular starting funds.`, display: "You found some money. You have {@dice 1d20} gp in addition to your regular starting funds."},
	{min: 5, result: "A relative bequeathed you a simple weapon of your choice."},
	{min: 6, result: () => `You found something interesting. You gain one additional trinket ${fmtChoice(rollTrinket())}.`, display: "You found something interesting. You gain one additional trinket."},
	{min: 7, result: "You once performed a service for a local temple. The next time you visit the temple, you can receive healing up to your hit point maximum."},
	{min: 8, result: "A friendly alchemist gifted you with a potion of healing or a flask of acid, as you choose."},
	{min: 9, result: "You found a treasure map."},
	{min: 10, result: () => `A distant relative left you a stipend that enables you to live at the comfortable lifestyle for {@dice 1d20} ${fmtChoice(RNG(20))} years. If you choose to live at a higher lifestyle, you reduce the price of the lifestyle by 2 gp during that time period.`, display: "A distant relative left you a stipend that enables you to live at the comfortable lifestyle for {@dice 1d20} years. If you choose to live at a higher lifestyle, you reduce the price of the lifestyle by 2 gp during that time period."},
];

const LIFE_EVENTS_CRIME = [
	{min: 1, result: "Murder"},
	{min: 2, result: "Theft"},
	{min: 3, result: "Burglary"},
	{min: 4, result: "Assault"},
	{min: 5, result: "Smuggling"},
	{min: 6, result: "Kidnapping"},
	{min: 7, result: "Extortion"},
	{min: 8, result: "Counterfeiting"},
];

const LIFE_EVENTS_PUNISHMENT = [
	{min: 1, max: 3, result: "You did not commit the crime and were exonerated after being accused."},
	{min: 4, max: 6, result: "You committed the crime or helped do so, but nonetheless the authorities found you not guilty."},
	{min: 7, max: 8, result: "You were nearly caught in the act. You had to flee and are wanted in the community where the crime occurred."},
	{min: 9, max: 12, result: () => `You were caught and convicted. You spent time in jail, chained to an oar, or performing hard labor. You served a sentence of {@dice 1d4} years ${fmtChoice(RNG(4))} or succeeded in escaping after that much time.`, display: "You were caught and convicted. You spent time in jail, chained to an oar, or performing hard labor. You served a sentence of {@dice 1d4} years or succeeded in escaping after that much time."},
];

const LIFE_EVENTS_SUPERNATURAL = [
	{min: 1, max: 5, result: () => `You were ensorcelled by a fey and enslaved for {@dice 1d6} ${fmtChoice(RNG(6))} years before you escaped.`, display: "You were ensorcelled by a fey and enslaved for {@dice 1d6} years before you escaped."},
	{min: 6, max: 10, result: "You saw a demon and ran away before it could do anything to you."},
	{min: 11, max: 15, result: () => `A devil tempted you. Make a DC 10 Wisdom saving throw. On a failed save, your alignment shifts one step toward evil (if it's not evil already), and you start the game with an additional {@dice 1d20 + 50} ${fmtChoice(RNG(20) + 50)} gp.`, display: "A devil tempted you. Make a DC 10 Wisdom saving throw. On a failed save, your alignment shifts one step toward evil (if it's not evil already), and you start the game with an additional {@dice 1d20 + 50} gp."},
	{min: 16, max: 20, result: "You woke up one morning miles from your home, with no idea how you got there."},
	{min: 21, max: 30, result: "You visited a holy site and felt the presence of the divine there."},
	{min: 31, max: 40, result: "You witnessed a falling red star, a face appearing in the frost, or some other bizarre happening. You are certain that it was an omen of some sort."},
	{min: 41, max: 50, result: "You escaped certain death and believe it was the intervention of a god that saved you."},
	{min: 51, max: 60, result: "You witnessed a minor miracle."},
	{min: 61, max: 70, result: "You explored an empty house and found it to be haunted."},
	{min: 71, max: 75, result: () => { const p = RNG(6); return `You were briefly possessed. Roll a {@dice d6} to determine what type of creature possessed you: 1, celestial; 2, devil; 3, demon; 4, fey; 5, elemental; 6, undead ${fmtChoice(`${p}; ${["celestial", "devil", "demon", "fey", "elemental", "undead"][p - 1]}`)}.` }, display: "You were briefly possessed. Roll a {@dice d6} to determine what type of creature possessed you: 1, celestial; 2, devil; 3, demon; 4, fey; 5, elemental; 6, undead."},
	{min: 76, max: 80, result: "You saw a ghost."},
	{min: 81, max: 85, result: "You saw a ghoul feeding on a corpse."},
	{min: 86, max: 90, result: "A celestial or a fiend visited you in your dreams to give a warning of dangers to come."},
	{min: 91, max: 95, result: () => `You briefly visited the Feywild or the Shadowfell ${choose("Feywild", "Shadowfell")}.`, "results": "You briefly visited the Feywild or the Shadowfell."},
	{min: 96, max: 100, result: "You saw a portal that you believe leads to another plane of existence."},
];

const LIFE_EVENTS_TRAGEDIES = [
	{min: 1, max: 2, result: () => `A family member or a close friend died. Roll on the {@table Supplemental Tables; Cause of Death|XGE|Cause of Death} supplemental table to find out how.`, display: "A family member or a close friend died. Roll on the Cause of Death supplemental table to find out how.", nextRoll: () => _lifeEvtResult("Cause of Death", rollSuppDeath())},
	{min: 3, result: "A friendship ended bitterly, and the other person is now hostile to you. The cause might have been a misunderstanding or something you or the former friend did."},
	{min: 4, result: "You lost all your possessions in a disaster, and you had to rebuild your life."},
	{min: 5, result: () => `You were imprisoned for a crime you didn't commit and spent {@dice 1d6} ${fmtChoice(RNG(6))} years at hard labor, in jail, or shackled to an oar in a slave galley.`, display: "You were imprisoned for a crime you didn't commit and spent {@dice 1d6} years at hard labor, in jail, or shackled to an oar in a slave galley."},
	{min: 6, result: "War ravaged your home community, reducing everything to rubble and ruin. In the aftermath, you either helped your town rebuild or moved somewhere else."},
	{min: 7, result: "A lover disappeared without a trace. You have been looking for that person ever since."},
	{min: 8, result: "A terrible blight in your home community caused crops to fail, and many starved. You lost a sibling or some other family member."},
	{min: 9, result: "You did something that brought terrible shame to you in the eyes of your family. You might have been involved in a scandal, dabbled in dark magic, or offended someone important. The attitude of your family members toward you becomes indifferent at best, though they might eventually forgive you."},
	{min: 10, result: "For a reason you were never told, you were exiled from your community. You then either wandered in the wilderness for a time or promptly found a new place to live."},
	{min: 11, result: () => `A romantic relationship ended. Roll a {@dice d6} ${fmtChoice(RNG(6))}. An odd number means it ended with bad feelings, while an even number means it ended amicably.`, display: "A romantic relationship ended. Roll a {@dice d6}. An odd number means it ended with bad feelings, while an even number means it ended amicably."},
	{min: 12, result: () => `A current or prospective romantic partner of yours died. Roll on the {@table Supplemental Tables; Cause of Death|XGE|Cause of Death} supplemental table to find out how. If the result is murder, roll a {@dice d12}. On a 1, you were responsible, whether directly or indirectly.`, display: "A current or prospective romantic partner of yours died. Roll on the {@table Supplemental Tables; Cause of Death|XGE|Cause of Death} supplemental table to find out how. If the result is murder, roll a {@dice d12}. On a 1, you were responsible, whether directly or indirectly.", nextRoll: () => _lifeEvtResult("Cause of Death", (() => { const r = RNG(12); const p = GenUtil.getFromTable(SUPP_DEATH, r); return {result: `${p.result}${r === 2 && RNG(12) === 1 ? ` ${fmtChoice("you were responsible")}` : ""}`} })())},
];

const LIFE_EVENTS_WAR = [
	{min: 1, result: "You were knocked out and left for dead. You woke up hours later with no recollection of the battle."},
	{min: 2, max: 3, result: "You were badly injured in the fight, and you still bear the awful scars of those wounds."},
	{min: 4, result: "You ran away from the battle to save your life, but you still feel shame for your cowardice."},
	{min: 5, max: 7, result: "You suffered only minor injuries, and the wounds all healed without leaving scars."},
	{min: 8, max: 9, result: "You survived the battle, but you suffer from terrible nightmares in which you relive the experience."},
	{min: 10, max: 11, result: "You escaped the battle unscathed, though many of your friends were injured or lost."},
	{min: 12, result: "You acquitted yourself well in battle and are remembered as a hero. You might have received a medal for your bravery."},
];

const LIFE_EVENTS_WEIRD_STUFF = [
	{min: 1, result: () => `You were turned into a toad and remained in that form for {@dice 1d4} ${fmtChoice(RNG(4))} weeks.`, display: "You were turned into a toad and remained in that form for {@dice 1d4} weeks."},
	{min: 2, result: "You were petrified and remained a stone statue for a time until someone freed you."},
	{min: 3, result: () => `You were enslaved by a hag, a satyr, or some other being and lived in that creature's thrall for {@dice 1d6} ${fmtChoice(RNG(6))} years.`, display: "You were enslaved by a hag, a satyr, or some other being and lived in that creature’s thrall for {@dice 1d6} years."},
	{min: 4, result: () => `A dragon held you as a prisoner for {@dice 1d4} ${fmtChoice(RNG(4))} months until adventurers killed it.`, display: "A dragon held you as a prisoner for {@dice 1d4} months until adventurers killed it."},
	{min: 5, result: "You were taken captive by a race of evil humanoids such as drow, kuo-toa, or quaggoths. You lived as a slave in the Underdark until you escaped."},
	{min: 6, result: "You served a powerful adventurer as a hireling. You have only recently left that service. Use the supplemental tables and work with your DM to determine the basic details about your former employer.", nextRoll: () => _lifeEvtPerson("Employer", getPersonDetails({isAdventurer: true}))},
	{min: 7, result: () => `You went insane for {@dice 1d6} ${fmtChoice(RNG(6))} years and recently regained your sanity. A tic or some other bit of odd behavior might linger.`, display: "You went insane for {@dice 1d6} years and recently regained your sanity. A tic or some other bit of odd behavior might linger."},
	{min: 8, result: "A lover of yours was secretly a silver dragon."},
	{min: 9, result: "You were captured by a cult and nearly sacrificed on an altar to the foul being the cultists served. You escaped, but you fear they will find you."},
	{min: 10, result: () => `You met a demigod, an archdevil, an archfey, a demon lord, or a titan, ${choose("demigod", "archdevil", "archfey", "demon lord", "titan")} and you lived to tell the tale.`, display: "You met a demigod, an archdevil, an archfey, a demon lord, or a titan, and you lived to tell the tale."},
	{min: 11, result: "You were swallowed by a giant fish and spent a month in its gullet before you escaped."},
	{min: 12, result: () => `A powerful being granted you a wish, but you squandered it on something frivolous.`, display: "A powerful being granted you a wish, but you squandered it on something frivolous."},
];

const SUPP_ALIGNMENT = [
	{min: 1, max: 3, result: () => rollOnArray(["混亂邪惡", "混亂中立"]), display: "混亂邪惡(50%) 或 混亂中立(50%)"},
	{min: 4, max: 5, result: "守序邪惡"},
	{min: 6, max: 8, result: "中立邪惡"},
	{min: 9, max: 12, result: "絕對中立"},
	{min: 13, max: 15, result: "中立善良"},
	{min: 16, max: 17, result: () => rollOnArray(["守序善良", "守序中立"]), display: "守序善良(50%) 或 守序中立(50%)"},
	{min: 18, result: () => rollOnArray(["混亂善良", "混亂中立"]), display: "混亂善良(50%) 或 混亂中立(50%)"},
];

const SUPP_DEATH = [
	{min: 1, result: "死因不明"},
	{min: 2, result: "被謀殺"},
	{min: 3, result: "在戰鬥中被殺"},
	{min: 4, result: "Accident related to class or occupation"},
	{min: 5, result: "Accident unrelated to class or occupation"},
	{min: 6, max: 7, result: "Natural causes, such as disease or old age"},
	{min: 8, result: "Apparent suicide"},
	{min: 9, result: () => `Torn apart by an animal or a natural disaster ${choose("animal", "natural disaster")}`, display: "Torn apart by an animal or a natural disaster"},
	{min: 10, result: () => "Consumed by a monster"},
	{min: 11, result: () => `Executed for a crime or tortured to death ${choose("executed for a crime", "tortured to death")}`, display: "Executed for a crime or tortured to death"},
	{min: 12, result: "Bizarre event, such as being hit by a meteorite, struck down by an angry god, or killed by a hatching slaad egg"},
];

const SUPP_CLASS = [
	{min: 1, max: 7, result: "野蠻人"},
	{min: 8, max: 14, result: "吟遊詩人"},
	{min: 15, max: 29, result: "牧師"},
	{min: 30, max: 36, result: "德魯伊"},
	{min: 37, max: 52, result: "戰士"},
	{min: 53, max: 58, result: "武僧"},
	{min: 59, max: 64, result: "聖武士"},
	{min: 65, max: 70, result: "遊俠"},
	{min: 71, max: 84, result: "遊蕩者"},
	{min: 85, max: 89, result: "術士"},
	{min: 90, max: 94, result: "契術師"},
	{min: 95, max: 100, result: "法師"},
];

const SUPP_OCCUPATION = [
	{min: 1, max: 5, result: "學者"},
	{min: 6, max: 10, result: () => `冒險者(${rollSuppClass().result})`, display: "冒險者 (從職業表中擲骰決定)"},
	{min: 11, result: "貴族"},
	{min: 12, max: 26, result: () => `工匠 或 公會成員 ${choose("工匠", "公會成員")}`, display: "工匠 或 公會成員"},
	{min: 27, max: 31, result: "罪犯"},
	{min: 32, max: 36, result: "藝人"},
	{min: 37, max: 38, result: () => `放逐者、隱士、或 難民 ${choose("放逐者", "隱士", "難民")}`, display: "放逐者、隱士、或 難民"},
	{min: 39, max: 43, result: () => `探險家 或 浪人 ${choose("探險家", "浪人")}`, display: "探險家 或 浪人"},
	{min: 44, max: 55, result: () => `農夫 或 牧人 ${choose("農夫", "牧人")}`, display: "農夫 或 牧人"},
	{min: 56, max: 60, result: () => `獵人 或 陷阱捕獸者 ${choose("獵人", "陷阱捕獸者")}`, display: "獵人 或 陷阱捕獸者"},
	{min: 61, max: 75, result: "勞工"},
	{min: 76, max: 80, result: "商人"},
	{min: 81, max: 85, result: () => `政治家 或 官僚 ${choose("政治家", "官僚")}`, display: "政治家 或 官僚"},
	{min: 86, max: 90, result: "祭司"},
	{min: 91, max: 95, result: "水手"},
	{min: 96, max: 100, result: "士兵"},
];

const SUPP_RACE = [
	{min: 1, max: 40, result: "人類"},
	{min: 41, max: 50, result: "矮人"},
	{min: 51, max: 60, result: "精靈"},
	{min: 61, max: 70, result: "半身人"},
	{min: 71, max: 75, result: "龍裔"},
	{min: 76, max: 80, result: "侏儒"},
	{min: 81, max: 85, result: "半精靈"},
	{min: 86, max: 90, result: "半獸人"},
	{min: 91, max: 95, result: "提夫林"},
	{min: 96, max: 100, result: "由DM決定"},
];

const SUPP_RELATIONSHIP = [
	{min: 3, max: 4, result: "敵對"},
	{min: 5, max: 10, result: "友善"},
	{min: 11, max: 12, result: "冷淡"},
];

const SUPP_STATUS = [
	{min: 3, result: () => { return `死亡 (${rollSuppDeath().result.lowercaseFirst()})` }, display: "死亡 (從死因表中擲骰決定)", "dead": true},
	{min: 4, max: 5, result: () => `失蹤 或 狀況不明 ${choose("失蹤", "狀況不明")}`, display: "失蹤 或 狀況不明"},
	{min: 6, max: 8, result: () => `活著，但因為重傷、經濟困難、或人際難題${choose("重傷", "經濟困難", "人際難題")}而過得很糟糕`, display: "活著，但因為重傷、經濟困難、或人際難題而過得很糟糕"},
	{min: 9, max: 12, result: "活著，且過得不錯"},
	{min: 13, max: 15, result: "活著，且頗有成就"},
	{min: 16, max: 17, result: "活著，且惡名昭彰"},
	{min: 18, result: "活著，且享譽盛名"},
];

let classList;
let bgList;
let trinketList;
let nameTables;
let $selCha;
let $selRace;
let $selBg;
let $selClass;
let $selAge;

function rollTrinket () {
	return rollOnArray(trinketList);
}

function onJsonLoad (lifeData, nameData) {
	bgList = lifeData.lifeBackground.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	classList = lifeData.lifeClass.sort((a, b) => SortUtil.ascSort(a.name, b.name));
	trinketList = lifeData.lifeTrinket;

	$selRace = $(`#race`).empty().attr("disabled", false);
	$selCha = $(`#cha`).empty().attr("disabled", false);
	$selBg = $(`#background`).empty().attr("disabled", false);
	$selClass = $(`#class`).empty().attr("disabled", false);
	$selAge = $(`#age`).empty().attr("disabled", false);

	$selRace.append(`<option value="Random" selected>隨機</option>`);
	$selRace.append(`<option value="Other">其他</option>`);
	RACES_SELECTABLE.forEach(r => $selRace.append(`<option value="${r}">${r}</option>`));
	RACES_UNSELECTABLE.forEach(r => $selRace.append(`<option class="italic" value="${r}">${Parser.RaceToDisplay(r)}</option>`));
	$selCha.append(`<option value="Random">隨機</option>`);
	for (let i = -5; i <= 5; ++i) {
		$selCha.append(`<option value="${i}" ${i === 0 ? "selected" : ""}>${i >= 0 ? "+" : ""}${i}</option>`)
	}
	$selBg.append(`<option value="-1" selected>隨機</option>`);
	bgList.forEach((b, i) => $selBg.append(`<option value="${i}">${b.name}</option>`));
	$selClass.append(`<option value="-1" selected>隨機</option>`);
	classList.forEach((c, i) => $selClass.append(`<option value="${i}">${c.name}</option>`));

	[
		{val: "", text: "隨機", style: "font-style: normal;"},
		{val: "1", text: "20 歲或更小", class: "italic"},
		{val: "21", text: "21&mdash;30 歲", class: "italic"},
		{val: "60", text: "31&mdash;40 歲", class: "italic"},
		{val: "70", text: "41&mdash;50 歲", class: "italic"},
		{val: "90", text: "51&mdash;60 歲", class: "italic"},
		{val: "100", text: "61 歲或更老", class: "italic"},
	].forEach(age => $selAge.append(`<option value="${age.val}" ${age.style ? `style="${age.style}"` : ""} ${age.class ? `class="${age.class}"` : ""}>${age.text}</option>`));

	nameTables = {};
	nameData.name.filter(it => it.source === SRC_XGE)
		.forEach(nameMeta => {
			nameTables[Parser.stringToSlug(nameMeta.name)] = nameMeta;

			if (nameMeta.name === "Elf" || nameMeta.name === "Human") {
				const cpy = MiscUtil.copy(nameMeta);
				if (nameTables["halfelf"]) nameTables["halfelf"].tables.push(...cpy.tables);
				else nameTables["halfelf"] = cpy;
			} else if (nameMeta.name === "Half-Orc") {
				nameTables["orc"] = MiscUtil.copy(nameMeta);
			} else if (nameMeta.name === "Tiefling") {
				const cpy = MiscUtil.copy(nameMeta);
				cpy.tables = cpy.tables.filter(it => it.option !== "Virtue");
				nameTables["devil"] = MiscUtil.copy(nameMeta);
			}
		});
}

function concatSentences (...lst) {
	const stack = [];
	lst.filter(it => it).forEach(it => {
		if (typeof it === "string" || typeof it === "number") {
			stack.push(it);
		} else if (typeof it === "function") {
			stack.push(it());
		} else { // array
			Array.prototype.push.apply(stack, ...it)
		}
	});
	return joinParaList(stack);
}

function joinParaList (lst) {
	if (lst.join) return lst.join(`<br>`);
	return lst;
}

const _VOWELS = ["a", "e", "i", "o", "u"];
function addN (name) {
	const c = name[0].toLowerCase();
	return _VOWELS.includes(c) ? "n" : "";
}

// SECTIONS ============================================================================================================
// generated in Parents, but used throughout
let knowParents;
let race;
let parentRaces;
let ptrParentLastName = {}; // store the last name so we can use it for both parents, maybe
// PARENTS
function sectParents () {
	knowParents = RNG(100) > 5;
	const selRace = $selRace.val();
	race = (() => {
		if (selRace === "Random") return GenUtil.getFromTable(SUPP_RACE, RNG(100)).result;
		else if (selRace === "Other") {
			// generate anything besides the values displayed in the dropdown
			let out;
			do out = GenUtil.getFromTable(SUPP_RACE, RNG(100)).result;
			while (RACES_SELECTABLE.includes(out));
			return out;
		} else return selRace;
	})();

	const $parents = $(`#parents`);
	const knowParentsStr = knowParents ? "<b>雙親：</b>你知道你的雙親是誰。" : "<b>雙親：</b>你不曉得你的雙親是什麼人。";

	let parentage = null;
	if (knowParents) {
		switch (race.toLowerCase()) {
			case "half-elf": {
				const rolled = GenUtil.getFromTable(PARENTS_HALF_ELF, RNG(8));
				parentage = `<b>${race} 雙親：</b> ${rolled.result}`;
				parentRaces = rolled._races;
				break;
			}
			case "half-orc": {
				const rolled = GenUtil.getFromTable(PARENTS_HALF_ORC, RNG(8));
				parentage = `<b>${race} 雙親：</b> ${rolled.result}`;
				parentRaces = rolled._races;
				break;
			}
			case "tiefling": {
				const rolled = GenUtil.getFromTable(PARENTS_TIEFLING, RNG(8));
				parentage = `<b>${race} 雙親：</b> ${rolled.result}`;
				parentRaces = rolled._races;
				break;
			}
			default:
				parentRaces = [race];
				break;
		}
	}

	if (selRace === "Other") {
		$parents.html(concatSentences(`<b>種族：</b> 其他 ${fmtChoice(`${Parser.RaceToDisplay(race)}; 使用{@table Supplemental Tables; Race|XGE|補充種族}表生成`, true)}`, knowParentsStr, parentage));
	} else {
		$parents.html(concatSentences(`<b>種族：</b> ${Parser.RaceToDisplay(race)}${selRace === "Random" ? ` ${fmtChoice("使用{@table Supplemental Tables; Race|XGE|補充種族}表生成", true)}` : ""}`, knowParentsStr, parentage));
	}

	if (knowParents) {
		parentRaces.shuffle();
		const mum = getPersonDetails({
			isParent: true,
			race: parentRaces[0],
			gender: "Female",
		});
		if (RNG(2) === 1) delete ptrParentLastName._; // 50% chance not to share a last name
		const dad = getPersonDetails({
			isParent: true,
			race: parentRaces.length > 1 ? parentRaces[1] : parentRaces[0],
			gender: "Male",
		});
		$parents.append(`<h5>母親</h5>`);
		$parents.append(joinParaList(mum));
		$parents.append(`<h5>父親</h5>`);
		$parents.append(joinParaList(dad));
	}
}

// BIRTHPLACE
function sectBirthplace () {
	const $birthplace = $(`#birthplace`);
	const rollBirth = RNG(100);
	const birth = `<b>出生場所：</b> ${GenUtil.getFromTable(BIRTHPLACES, rollBirth).result}`;

	const strangeBirth = RNG(100) === 100 ? "A strange event coincided with your birth: the moon briefly turning red, all the milk within a mile spoiling, the water in the area freezing solid in midsummer, all the iron in the home rusting or turning to silver, or some other unusual event of your choice" : "";
	$birthplace.html(concatSentences(birth, strangeBirth));
}

// SIBLINGS
function sectSiblings () {
	const $siblings = $(`#siblings`);
	function getBirthOrder (rollBirthOrder) {
		if (rollBirthOrder < 3) {
			return "雙、三、或四胞胎"
		} else if (rollBirthOrder < 8) {
			return "兄姊";
		} else {
			return "弟妹";
		}
	}
	function getBirthOrderAndGender (rollBirthOrder) {
		if (rollBirthOrder < 3) {
			return chooseRender("兄弟", "姊妹")
		} else if (rollBirthOrder < 8) {
			return chooseRender("哥哥", "姊姊");
		} else {
			return chooseRender("弟弟", "妹妹");
		}
	}
	const rollSibCount = RNG(5);
	let sibCount = 0;
	switch (rollSibCount) {
		case 2:
			sibCount = RNG(3);
			break;
		case 3:
			sibCount = RNG(4) + 1;
			break;
		case 4:
			sibCount = RNG(6) + 2;
			break;
		case 5:
			sibCount = RNG(8) + 3;
			break;
	}
	console.log(race);
	if (race === "Elf" || race === "Dwarf") {
		sibCount = Math.max(sibCount - 2, 0);
	}

	if (sibCount > 0) {
		$siblings.empty();
		$siblings.append(`<p>你有 ${sibCount} 個兄弟姊妹。</p>`);
		for (let i = 0; i < sibCount; ++i) {
			const siblingType = rollOnArray(["兄弟", "姐妹"]);
			$siblings.append(`<h5>${getBirthOrder()} 平輩 ${fmtChoice(siblingType, true)}</h5>`);
			$siblings.append(joinParaList(getPersonDetails({
				gender: siblingType === "兄弟" ? "男性" : "女性",
				parentRaces: parentRaces,
				isSibling: true,
			})));
		}
	} else {
		$siblings.html("你是家中的獨生子。");
	}
}

// FAMILY
function sectFamily () {
	function getChaVal () {
		const raw = $selCha.val();
		if (raw === "Random") return RollerUtil.randomise(11) - 6;
		else return Number(raw);
	}

	const $family = $(`#family`);
	$family.empty();
	$family.append(`<b>家族：</b> ${GenUtil.getFromTable(FAMILY, RNG(100)).result}<br>`);
	let famIndex = 1;
	const $btnSuppFam = $(`<button class="btn btn-xs btn-default btn-supp-fam no-print"></button>`).on("click", () => {
		const supDetails = getPersonDetails();
		const $wrpRes = $(`<div class="life__output-wrp-border p-3 my-2"/>`);
		$wrpRes.append(`<h5 class="mt-0">家族成員 擲骰結果 ${famIndex++}</h5>`);
		$wrpRes.append(joinParaList(supDetails));
		$btnSuppFam.css("margin-bottom", 5);
		$btnSuppFam.after($wrpRes);
	});
	$family.append(`<span class="note">你可以從關係表中擲骰決定你的家族成員或其他你人生中的重要人物是如何看待你的。你也可以使用種族、工作職業、和陣營表以決定更多關於家族成員或撫養你長大的監護人的情報。</span>`);
	$family.append($btnSuppFam);

	const rollFamLifestyle = GenUtil.getFromTable(FAMILY_LIFESTYLE, RNG(6) + RNG(6) + RNG(6));
	$family.append(`<b>家族生活風格：</b> ${rollFamLifestyle.result}<br>`);
	const rollFamHome = Math.min(Math.max(RNG(100) + rollFamLifestyle.modifier, 0), 111);
	const rollFamHomeRes = GenUtil.getFromTable(CHILDHOOD_HOME, rollFamHome).result;
	$family.append(`<b>童年家園：</b> ${rollFamHomeRes}<br>`);

	const rollChildMems = Math.min(Math.max(RNG(6) + RNG(6) + RNG(6) + getChaVal(), 3), 18);
	$family.append(`<b>童年回憶：</b> ${GenUtil.getFromTable(CHILDHOOD_MEMORIES, rollChildMems).result}`);
}

// PERSONAL DECISIONS
function sectPersonalDecisions () {
	const $personal = $(`#personal`).empty();
	const selBg = Number($selBg.val());
	const myBg = selBg === -1 ? rollOnArray(bgList) : bgList[selBg];
	$personal.append(`<b>背景：</b> ${myBg.name}<br>`);
	$personal.append(`<b>我成為了一名${myBg.name}，因為：</b> ${rollOnArray(myBg.reasons)}`);
}

// CLASS TRAINING
function sectClassTraining () {
	const $clss = $(`#clss`).empty();
	const selClass = Number($selClass.val());
	const myClass = selClass === -1 ? rollOnArray(classList) : classList[selClass];
	$clss.append(`<b>職業：</b> ${myClass.name}<br>`);
	$clss.append(`<b>我成為了一名${myClass.name}，因為：</b> ${rollOnArray(myClass.reasons)}`);
}

// LIFE EVENTS
function sectLifeEvents () {
	const $events = $(`#events`).empty();
	marriageIndex = 0;
	const age = GenUtil.getFromTable(LIFE_EVENTS_AGE, Number($selAge.val()) || RNG(100));
	$events.append(`<b>現在年紀：</b> ${age.result} ${fmtChoice(`${age.age}歲`, true)}`);
	for (let i = 0; i < age.events; ++i) {
		$events.append(`<h5>人生大事 ${i + 1}</h5>`);
		const evt = GenUtil.getFromTable(LIFE_EVENTS, RNG(100));
		$events.append(`${evt.result}<br>`);
		if (evt.nextRoll) {
			if (evt.nextRoll.title) {
				$(`<div class="life__output-wrp-border p-3 my-2">
					<h5 class="mt-0">${evt.nextRoll.title}</h5>
					${joinParaList(evt.nextRoll.result)}
				</div>`).appendTo($events);
			} else {
				$events.append(`${joinParaList(evt.nextRoll.result)}<br>`);
				if (evt.nextRoll.nextRoll) {
					if (evt.nextRoll.nextRoll.title) {
						$(`<div class="life__output-wrp-border p-3 my-2">
							<h5 class="mt-0">${evt.nextRoll.nextRoll.title}</h5>
							${joinParaList(evt.nextRoll.nextRoll.result)}
						</div>`).appendTo($events);
					} else {
						$events.append(`${joinParaList(evt.nextRoll.nextRoll.result)}<br>`);
					}
				}
			}
		}
	}
}

function roll () {
	$(`.life__output`).show();

	sectParents();
	sectBirthplace();
	sectSiblings();
	sectFamily();
	sectPersonalDecisions();
	sectClassTraining();
	sectLifeEvents();
}

window.addEventListener("load", async () => {
	ExcludeUtil.pInitialise(); // don't await, as this is only used for search
	const [lifeData, nameData] = await Promise.all([
		DataUtil.loadJSON("data/life.json"),
		DataUtil.loadJSON("data/names.json"),
	]);
	onJsonLoad(lifeData, nameData);

	$(`#age`).on("change", function () {
		if ($(this).val()) {
			$(this).addClass("italic")
		} else {
			$(this).removeClass("italic")
		}
	});

	$(`#xge_link`).replaceWith(Renderer.get().render(`{@book 姍納薩的萬事指南|XGE|1|This Is Your Life}`));

	window.dispatchEvent(new Event("toolsLoaded"));
});
