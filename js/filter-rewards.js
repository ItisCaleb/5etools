"use strict";

const displayRewardType = function(item){
	switch(item){
		case "Blessing": return "祝福";
		case "Boon": return "恩惠";
		case "Charm": return "護咒";
		default: return item;
	};
}

class PageFilterRewards extends PageFilter {
	constructor () {
		super();

		this._sourceFilter = new SourceFilter();
		this._typeFilter = new Filter({
			header: "Type",
			headerName: "類型",
			items: [
				"Blessing",
				"Boon",
				"Charm",
			],
			displayFn: displayRewardType
		});
	}

	static mutateForFilters (it) {
		// No-op
	}

	addToFilters (reward, isExcluded) {
		if (isExcluded) return;

		this._sourceFilter.addItem(reward.source);
		this._typeFilter.addItem(reward.type);
	}

	async _pPopulateBoxOptions (opts) {
		opts.filters = [
			this._sourceFilter,
			this._typeFilter,
		];
	}

	toDisplay (values, r) {
		return this._filterBox.toDisplay(
			values,
			r.source,
			r.type,
		)
	}
}
