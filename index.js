/**
 * @fileoverview Slide.
 * @author basilwang wanghuajie@yunwii.com
 */
/**
 * KISSY.use('../index',function(S,Slide){
 *		Slide.init();
 * });
 */
KISSY.add("h5-home/widgets/simple-slide/index", function(S, Node, iScroll) {
	var requestAnimFrame = function() {
		return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
				window.setTimeout(callback, 1e3 / 60);
			};
	}();
	function SimpleSlide() {
		this.init.apply(this, arguments);
	}
	S.augment(SimpleSlide, {
		init: function(cfg) {
			this.config(cfg);
			this.container = S.one(this.get("container"));
			this.set("container", this.container);
			this.circular = this.get("circular");
			this.circularCopy = this.get("circularCopy") === false ? false : true;
			this.duration = this.get("duration");
			this.autoPlay = this.get("autoPlay");
			this.vertical = this.get("vertical");
			this.timeout = this.get("timeout");
			this.width = parseFloat(this.get("width"));
			this.height = parseFloat(this.get("height"));
			this.ratio = this.get("ratio");
			this.currentCls = this.get("currentCls");
			this.activeCls = this.get("activeCls");
			this.scrollerPage = this.vertical ? "pageY" : "pageX";
			this.items = this._getItems();
			this.triggers = this._getTriggers();
			this.itemList = this.items.parent();
			this.scrollCon = this.itemList.parent();
			this.total = this.items.length;
			this.len = this.total;
			this.scrolling = false;
		},
		config: function(cfg) {
			this._config = S.merge({
				container: null,
				items: "li",
				triggers: "",
				currentCls: "m-simpleslide-current",
				activeCls: "m-simpleslide-active",
				circular: false,
				autoPlay: false,
				bounce: true,
				snap: true,
				snapThreshold: .3,
				duration: 400,
				timeout: 3e3,
				index: 0,
				width: 0,
				height: 0,
				ratio: 0,
				onSwitch: null
			}, cfg);
		},
		destroy: function() {
			this.container.detach("touchmove", this._preventScroll, this);
			this.stop(true);
			this.scroller && this.scroller.destroy();
		},
		render: function() {
			this.renderUI();
			this.bindUI();
			this.syncUI();
		},
		renderUI: function() {
			this._getSize();
			this._fixCircular();
			this._renderCls();
			this._renderStyle();
			this._renderScroller();
		},
		bindUI: function() {
			var self = this;
			this.scroller.on("scrollEnd", S.bind(this._onScrollEnd, this));
			this.scroller.on("beforeScrollStart", S.bind(this._onScrollStart, this));
			this.scroller.on("scrollStart", S.bind(this._onScrollStart, this));
			if (this.vertical) {
				this.container.on("touchmove", this._preventScroll, this);
			}
		},
		syncUI: function() {
			var index = this.get("index"), realIndex = this.getRealIndex(index);
			this.scrollTo(realIndex);
			this._syncCls({
				from: index,
				index: index
			});
			this.play();
		},
		get: function(key) {
			return this._config[key];
		},
		set: function(key, value) {
			var val = this.get(key);
			if (val !== value) {
				this._config[key] = value;
				this.change(key, value, val);
			}
		},
		change: function(attr, newVal, prevVal) {
			var m = "_after" + attr.substring(0, 1).toUpperCase() + attr.substring(1) + "Change";
			this[m] && this[m]({
				newVal: newVal,
				prevVal: prevVal
			});
			return this;
		},
		scrollTo: function(index, time) {
			if (this.scroller) {
				this.scrolling = true;
				this.scroller.goToPage(this.vertical ? 0 : index, this.vertical ? index : 0, time || 0);
				if (!time) {
					this.scrolling = false;
					this.set("index", this.getIndex(index));
				}
			}
			return this;
		},
		play: function(force) {
			var self = this, next;
			if (force) {
				this.autoPlay = true;
			}
			if (this.autoPlay) {
				next = function() {
					requestAnimFrame(function() {
						clearTimeout(self.timer);
						self.next();
					});
				};
				this.stop();
				this.timer = setTimeout(next, this.timeout);
			}
			return this;
		},
		stop: function(force) {
			clearTimeout(this.timer);
			delete this.timer;
			if (force) {
				this.autoPlay = false;
			}
			return this;
		},
		next: function(duration) {
			var index = this.getRealIndex(this.get("index") + 1);
			return this.scrollTo(index, typeof duration === "undefined" ? this.duration : duration);
		},
		prev: function(duration) {
			var index = this.getRealIndex(this.get("index") - 1);
			return this.scrollTo(index, typeof duration === "undefined" ? this.duration : duration);
		},
		refresh: function() {
			var index = this.getRealIndex(this.get("index")), page;
			this._getSize();
			this._renderStyle();
			if (this.scroller) {
				this.scroller.refresh();
				page = this.scroller.currentPage[this.scrollerPage];
				if (page === index) {
					this.scrollTo(index);
					this.play();
				} else {
					this.scrollTo(page);
				}
			}
			return this;
		},
		getIndex: function(index) {
			if (this.circular) {
				index -= 1;
				if (index < 0) {
					index = this.total - 1;
				} else if (index === this.total) {
					index = 0;
				}
			}
			return index;
		},
		getRealIndex: function(index) {
			var total = this.circular ? this.len : this.total;
			index = this.circular ? index + 1 : index;
			return index % total;
		},
		_renderCls: function() {
			this.container.addClass("m-simpleslide");
			this.itemList.addClass("m-simpleslide-list");
			this.items.addClass("m-simpleslide-item");
			if (this.triggers) {
				this.triggers.addClass("m-simpleslide-trigger");
			}
		},
		_renderStyle: function() {
			this.scrollCon.css("overflow", "hidden");
			this.scrollCon.css("-webkit-transform", "translateZ(0)");
			this.itemList.css(this.vertical ? {
				width: this.cWidth + "px",
				height: this.cHeight * this.len + "px"
			} : {
				width: this.cWidth * this.len + "px",
				height: this.cHeight + "px"
			});
			this.items.css({
				"float": this.vertical ? "none" : "left",
				width: this.cWidth + "px",
				height: this.cHeight + "px"
			});
		},
		_renderScroller: function() {
			var self = this, snap = this.get("snap"), bounce = this.get("bounce"), vertical = this.get("vertical"), circular = this.circular, snapThreshold = this.get("snapThreshold");
			this.scroller = new iScroll(this.scrollCon[0], {
				snap: snap,
				snapThreshold: snapThreshold,
				momentum: false,
				bounce: bounce && !circular,
				eventPassthrough: vertical ? "horizontal" : "vertical",
				preventDefault: false,
				scrollX: vertical ? false : true,
				scrollY: vertical ? true : false
			});
		},
		_getItems: function() {
			var items = this.get("items");
			if (typeof items === "string") {
				items = this.container.all(items);
			}
			return items;
		},
		_getTriggers: function() {
			var triggers = this.get("triggers");
			if (!triggers) {
				triggers = null;
			} else if (typeof triggers === "string") {
				triggers = this.container.all(triggers);
			}
			return triggers;
		},
		_getSize: function() {
			this.cWidth = this.width || this.scrollCon.width();
			this.cHeight = this.height || this.scrollCon.height();
			if (this.ratio) {
				this.cHeight = this.cWidth * this.ratio;
			}
		},
		_fixCircular: function() {
			var first, last, firstClone, lastClone;
			if (this.circular) {
				if (this.circularCopy) {
					first = this.items.item(0);
					last = this.items.item(this.total - 1);
					firstClone = first.clone(true);
					lastClone = last.clone(true);
					firstClone[0]._cloneNode = first[0];
					lastClone[0]._cloneNode = last[0];
					this.itemList.prepend(lastClone);
					this.itemList.append(firstClone);
					this.items = this._getItems();
					this.len = this.items.length;
				} else {
					this.total = this.len - 2;
				}
			}
		},
		_fixCircularPos: function(realIndex) {
			var that = this, index = realIndex;
			if (this.circular) {
				that.scrollTo(index);
			}
		},
		_syncCls: function(e) {
			var from = this.getRealIndex(e.from), index = this.getRealIndex(e.index);
			this.items.item(from).removeClass(this.currentCls);
			this.items.item(index).addClass(this.currentCls);
			if (this.triggers) {
				this.triggers.item(e.from).removeClass(this.activeCls);
				this.triggers.item(e.index).addClass(this.activeCls);
			}
		},
		_preventScroll: function(e) {
			e.preventDefault();
		},
		_onScrollStart: function(e) {
			this.scrolling = true;
		},
		_onScrollEnd: function(e) {
			var scroller = this.scroller;
			index = this.getIndex(scroller.currentPage[this.scrollerPage]);
			this.scrolling = false;
			this.set("index", index);
		},
		_afterIndexChange: function(e) {
			var realIndex = this.getRealIndex(e.newVal), facade;
			this._fixCircularPos(realIndex);
			facade = {
				from: e.prevVal,
				to: e.newVal,
				index: e.newVal,
				realIndex: realIndex
			};
			this._syncCls(facade);
			this.play();
			this.onSwitch && this.onSwitch(facade);
		}
	});
	return SimpleSlide;
}, {
	requires: [ "node", "../iscroll/" ]
});

