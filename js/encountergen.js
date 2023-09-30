"use strict";

const tablePage = new TablePage({
	jsonUrl: "data/encounters.json",
	dataProp: "encounter",
	listClass: "encounters",
	tableCol1: "Encounter",
	fnGetTableName: (meta, table) => `${meta.name} 遭遇 (等級  ${table.minlvl}\u2014${table.maxlvl})`,
	fnGetTableHash: (meta, table) => UrlUtil.encodeForHash([meta.name, meta.source, `${table.minlvl}-${table.maxlvl}`]),
});

window.addEventListener("load", tablePage.pInit.bind(tablePage));
