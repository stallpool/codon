//@include mobile.js

(function (window, document) {
   'use strict';

   var system = {
      defaultFontSize: 16,
      defaultTextColor: 'black',
      defaultLineNumberColor: '#4466ff',
      defaultScrollBarColor: 'rgba(200, 200, 200, 0.5)',
      defaultScrollBarBorderColor: 'rgb(225, 225, 225)',
      defaultScrollSlideColor: 'rgb(150, 150, 150, 0.5)',
      defaultScrollSlideBorderColor: 'rgb(100, 100, 100)',
   };
   var math = {
      xRectRect: function (x1, y1, w1, h1, x2, y2, w2, h2) {
         if (x1 > x2 + w2) return false;
         if (x2 > x1 + w1) return false;
         if (y1 > y2 + h2) return false;
         if (y2 > y1 + h1) return false;
         return true;
      },
      xPointRect: function (x0, y0, x, y, w, h) {
         if (x0 < x || x0 > x + w) return false;
         if (y0 < y || y0 > y + h) return false;
         return true;
      }
   };

   /**
    * + Codon Editor
    * |--- LineNumber / OffsetNumber
    * |--- Text
    */

   function measureText(pen, text) {
      return pen.measureText(text);
   }

   function generateRandomString(n) {
      var s = [];
      while (n--) s.push(String.fromCharCode(~~(Math.random() * 96 + 32)));
      return s.join('');
   }

   function CodonEditor(dom, options) {
      this.options = options || {};
      this._useDefaultOptions();
      this.ref_dom = dom;
      this.dom = document.createElement('canvas');
      this.ref_dom.appendChild(this.dom);
      this.pen = this.dom.getContext('2d');
      this._cache = null;
      this.editor_text_theme = new CodonTheme();
      this.editor_text = new CodonEditorText(this, this.editor_text_theme);
      this.editor_linemark_theme = new CodonTheme();
      this.editor_linemark = new CodonEditorLineMark(this, this.editor_linemark_theme);
      this._size = null;
      this.layout(); // this.size = { width, height, font }
      this._registerEvents();
   }
   CodonEditor.prototype = {
      memorize: function (data) {
         this._cache = data || this.pen.getImageData(
            0, 0, this.dom.offsetWidth, this.dom.offsetHeight
         );
      },
      restore: function () {
         if (!this._cache) return;
         this.pen.putImageData(this._cache, 0, 0);
      },
      layout: function () {
         if (!this.ref_dom) return;
         this._size = {
            width: this.ref_dom.offsetWidth || 1,
            height: this.ref_dom.offsetHeight || 1,
            font: system.defaultFontSize
         };
         this.dom.style.width = this._size.width + 'px';
         this.dom.style.height = this._size.height + 'px';
         this.dom.width = this._size.width;
         this.dom.height = this._size.height;
         this._adjustFontSize();
         this._adjustLineMarkAndTextWindow();
         this.restore();
      },
      paint: function () {
         this.editor_text.visualize();
         this.editor_linemark.visualize();
      },
      dispose: function () {},
      size: function (update) {
         if (update) {
            this._size = Object.assign(this._size, update);
         }
         return Object.assign({}, this._size);
      },
      getObjectAt: function (x, y) {
         var linemark_size = this.editor_linemark.size();
         var text_size = this.editor_text.size();
         if (math.xPointRect(
            x, y,
            linemark_size.x,
            linemark_size.y,
            linemark_size.width,
            linemark_size.height
         )) {
            return this.editor_linemark.getObjectAt(
               x - linemark_size.x,
               y - linemark_size.y
            );
         } else if (math.xPointRect(
            x, y,
            text_size.x,
            text_size.y,
            text_size.width,
            text_size.height
         )) {
            return this.editor_text.getObjectAt(
               x - text_size.x,
               y - text_size.y
            );
         }
         return null;
      },
      _useDefaultOptions: function () {
         if (this.options.showLineNumbers === undefined) {
            this.options.showLineNumbers = true;
         }
      },
      _adjustLineMarkAndTextWindow: function () {
         var linemark_w = 0;
         if (this.options.showLineNumbers) {
            linemark_w = this.editor_linemark.getLineWidth() + 10 + 25;
         }
         this.editor_linemark.size({
            x: 0, width: linemark_w,
            y: 0, height: this._size.height
         });
         this.editor_text.size({
            x: linemark_w, width: this._size.width - linemark_w,
            y: 0, height: this._size.height
         });
         this.editor_linemark.layout();
         this.editor_text.layout();
      },
      _adjustFontSize: function () {
         this.pen.font = this._size.font + 'px monospace';
      },
      _registerEvents: function () {
         var _this = this;
         this.dom.focus();
         this.dom.addEventListener('mousewheel', function (evt) {
            evt.preventDefault();
            var dx = evt.deltaX;
            var dy = evt.deltaY;
            pan(dx, dy);
         });

         var mobile_env = { x: null, y: null, selecting: false };
         var mobiletouch = window.PetalMobileInteraction({
            touchpinch: function (target, pos) {},
            touchmove: function (target, pos) {
               if (mobile_env.selecting) {
               } else {
                  var last_x = mobile_env.x;
                  var last_y = mobile_env.y;
                  var x = pos.clientX, y = pos.clientY;
                  if (x === last_x && y === last_y) return;
                  if (last_x !== null && last_y !== null) {
                     var dx = x - last_x, dy = y - last_y;
                     pan(-dx, -dy);
                  }
                  mobile_env.x = x;
                  mobile_env.y = y;
               }
            },
            touchend: function (target, pos) {
               mobile_env.x = null;
               mobile_env.y = null;
            }
         });
         mobiletouch.config().pinch.enable = true;
         mobiletouch.bind(this.dom);

         var interaction = PetalInteraction({});
         interaction.bind(this.dom);

         function pan(dx, dy) {
            _this.editor_text.pan(dx, dy);
            _this.editor_linemark.syncPan(0, _this.editor_text.view().y);
         }
      }
   };

   function CodonTheme(_default) {
      this._map = {};
      this._default = _default || system.defaultTextColor;
   }
   CodonTheme.prototype = {
      has: function (tag) {
         return !!this._map[tag];
      },
      get: function (tag) {
         return this._map[tag] || this._default;
      },
      set: function (tag, fillStyle) {
         this._map[tag] = fillStyle;
      },
      setDefault: function (fillStyle) {
         this._default = fillStyle;
      }
   };

   function CodonEditorLineMark(editor, theme) {
      this.editor = editor;
      this.theme = theme;
      if (!this.theme.has('selected')) this.theme.set('selected', '#000099');
      this._visobj = null;
      this._size = {};
      this._options = {};
      this.layout();
      this._panPaintLock = 0;
   }
   CodonEditorLineMark.prototype = {
      debug: function (editor_text) {
         if (editor_text && editor_text._visobj) {
            this._visobj = {
               lines: editor_text._visobj.lines.map(function (_, i) {
                  return { value: '' + (i + 1) };
               })
            };
         } else {
            this._visobj = {
               lines: [
                  { value: '   1', theme: 'selected' },
                  { value: '  10' },
                  { value: ' 998' },
                  { value: ' 999' },
                  { value: '1000' }
               ]
            };
         }
      },
      syncPan: function (_, viewY) {
         if (viewY < 0) viewY = 0;
         this._size.viewTop = viewY;
         var _this = this;
         if (this._panPaintLock) cancelAnimationFrame(this._panPaintLock);
         this._panPaintLock = requestAnimationFrame(function () {
            _this.visualize();
            _this._panPaintLock = 0;
         });
      },
      visualize: function () {
         if (!this._size || !this._size.width) return;
         var x = this._size.x || 10;
         var y = this._size.y || 0;
         var w = this._size.width || 1;
         var h = this._size.height || 1;
         var line_height = (this._size.font || system.defaultFontSize) + 4;
         var viewY = this._size.viewTop || 0;

         var _this = this;
         this.editor.pen.clearRect(x-1, y, w+1, h);
         this.theme.setDefault(system.defaultLineNumberColor);
         if (!this._visobj) return;
         this.editor.pen.save();
         var region = new window.Path2D();
         region.rect(x, y, w, h);
         this.editor.pen.clip(region);

         var alignX = this.getLineWidth();
         var visible_line_st_index = Math.floor(viewY / line_height);
         var visible_line_ed_index = visible_line_st_index + Math.ceil(h / line_height) + 1;
         var visible_lines = this._visobj.lines.slice(visible_line_st_index, visible_line_ed_index);
         var offsetY = this._size.y + visible_line_st_index * line_height - viewY;
         visible_lines.forEach(function (line, i) {
            _this.editor.pen.fillStyle = _this.theme.get(line.theme);
            _this.editor.pen.fillText(line.value, x + alignX - line.width, offsetY+(i+1)*line_height);
         });
         this.editor.pen.restore();
      },
      layout: function () {
         var size =  this.editor.size();
         this._size.height = size.height;
         this._size.width = this.getLineWidth();
      },
      getLineWidth: function () {
         if (this.__last_max_w) return this.__last_max_w || 0;
         var w = 0, _this = this;
         this._visobj && this._visobj.lines.forEach(function (line) {
            var rect = measureText(_this.editor.pen, line.value || ' ');
            line.width = rect.width;
            if (rect.width > w) w = rect.width;
         });
         this.__last_max_w = w;
         return w;
      },
      size: function (update) {
         if (update) {
            this._size = Object.assign(this._size, update);
         }
         return Object.assign({}, this._size);
      },
      view: function () {
         return { x: this._size.viewLeft || 0, y: this._size.viewTop || 0 };
      },
      getObjectAt: function (x, y) {
         return null;
      },
      dispose: function () {
         this.editor = null;
         this.theme = null;
         this._size = null;
         this._visobj = null;
      }
   };

   function CodonEditorText(editor, theme) {
      this.editor = editor;
      this.theme = theme || new CodonTheme();
      this._visobj = null;
      this._size = {};
      this.layout();
      this.scrollbar = {
         vertical: null,
         horizontal: null
      };
      this._panPaintLock = 0;
   }
   CodonEditorText.prototype = {
      debug: function () {
         this._visobj = {
            lines: [
               { value: 'Hello World\n' },
               { value: 'abcdefghijklmnopqrstuvwxyz✪\n' },
               { value: '1234567890-=[]\\;\',./\n' },
               { value: [
                  { value: '/* ~!@#$%^&*()_+ */', theme: 'woo' },
                  { value: '{}|:"<>?\n' }]
               },
               { value: 'This stentence is very long: ' + generateRandomString(100) }
            ]
         };
         for(var i = 0; i < 100; i++) this._visobj.lines.push({
            value: generateRandomString(~~(Math.random()*10)+10)
         });
         this.theme.set('woo', 'green');
         // Notice: when change _visobj.lines, need to clear __last_max_w
         this.__last_max_w = 0;
         this.getLineWidth();
      },
      pan: function (dx, dy) {
         var line_height = (this._size.font || system.defaultFontSize) + 4;
         var viewX = (this._size.viewLeft || 0) + dx;
         var viewY = (this._size.viewTop || 0) + dy;
         if (viewX < 0) viewX = 0;
         if (viewY < 0) viewY = 0;
         this._size.viewRight = this.getLineWidth();
         this._size.viewBottom = this._visobj?this._visobj.lines.length:0;
         this._size.viewBottom *= line_height;
         var viewMaxX = this._size.viewRight - this._size.width + 15;
         var viewMaxY = this._size.viewBottom - this._size.height + line_height;
         if (viewMaxX < 0 ) viewMaxX = 0;
         if (viewMaxY < 0) viewMaxY = 0;
         if (viewX > viewMaxX) viewX = viewMaxX;
         if (viewY > viewMaxY) viewY = viewMaxY;
         this._size.viewLeft = viewX;
         this._size.viewTop = viewY;
         var _this = this;
         if (this._panPaintLock) cancelAnimationFrame(this._panPaintLock);
         this._panPaintLock = requestAnimationFrame(function () {
            _this.visualize();
            _this._panPaintLock = 0;
         });
      },
      _paintScrollBar: function(scrollbar) {
         this.editor.pen.beginPath();
         this.editor.pen.rect(scrollbar.x, scrollbar.y, scrollbar.w, scrollbar.h);
         this.editor.pen.fillStyle =  scrollbar.barFillStyle || system.defaultScrollBarColor;
         this.editor.pen.fill();
         this.editor.pen.strokeStyle = scrollbar.barStrokeStyle || system.defaultScrollBarBorderColor;
         this.editor.pen.stroke();

         this.editor.pen.beginPath();
         this.editor.pen.rect(scrollbar.sx, scrollbar.sy, scrollbar.sw, scrollbar.sh);
         this.editor.pen.fillStyle = scrollbar.slideFillStyle || system.defaultScrollSlideColor;
         this.editor.pen.fill();
         this.editor.pen.strokeStyle = scrollbar.slideStrokeStyle || system.defaultScrollSlideBorderColor;
         this.editor.pen.stroke();
      },
      _visualizeVerticalScroll: function(x, y, w, h, top) {
         if (!this._visobj) return;
         var line_height = (this._size.font || system.defaultFontSize) + 4;
         var bottom = (this._visobj.lines.length+1)*line_height;
         if (h >= bottom + line_height) {
            this.scrollbar.vertical = null;
            return;
         }
         var scrollbar = this.scrollbar.vertical;
         if (!scrollbar) {
            scrollbar = {};
            this.scrollbar.vertical = scrollbar;
         }
         scrollbar.x = x + w - 10;
         scrollbar.sx = scrollbar.x;
         scrollbar.y = y;
         scrollbar.w = 10;
         scrollbar.sw = scrollbar.w;
         scrollbar.h = h;
         scrollbar.sh = h * h / bottom;
         if (scrollbar.sh < 2) scrollbar.sh = 2;
         scrollbar.sy = y + (h - scrollbar.sh) / (bottom - h - 10) * top;
         this._paintScrollBar(scrollbar);
      },
      _visualizeHorizontalScroll: function (x, y, w, h, left) {
         var right = this.getLineWidth();
         if (w >= right + 10) {
            this.scrollbar.horizontal = null;
            return;
         }
         var scrollbar = this.scrollbar.horizontal;
         if (!scrollbar) {
            scrollbar = {};
            this.scrollbar.horizontal = scrollbar;
         }
         scrollbar.x = x;
         scrollbar.y = y + h - 10;
         scrollbar.sy = scrollbar.y;
         scrollbar.w = w;
         scrollbar.h = 10;
         scrollbar.sh = scrollbar.h;
         scrollbar.sw = w * w / right;
         if (scrollbar.sw < 2) scrollbar.sw = 2;
         scrollbar.sx = x + (w - scrollbar.sw) / (right - w) * left ;
         this._paintScrollBar(scrollbar);
      },
      visualize: function() {
         var x = this._size.x || 0;
         var y = this._size.y || 0;
         var w = this._size.width || 1;
         var h = this._size.height || 1;
         var line_height = (this._size.font || system.defaultFontSize) + 4;
         var viewX = this._size.viewLeft || 0;
         var viewY = this._size.viewTop || 0;

         var _this = this;
         this.theme.setDefault(system.defaultTextColor);
         this.editor.pen.clearRect(x-1, y, w+1, h);
         if (!this._visobj) return;
         this.editor.pen.save();
         var region = new window.Path2D();
         region.rect(x, y, w, h);
         this.editor.pen.clip(region);

         var visible_line_st_index = Math.floor(viewY / line_height);
         var visible_line_ed_index = visible_line_st_index + Math.ceil(h / line_height) + 1;
         // var visible_lines = this._visobj.lines.slice(visible_line_st_index, visible_line_ed_index);
         var offsetY = this._size.y + visible_line_st_index * line_height - viewY;
         for (var j = visible_line_st_index, i = 0; j < visible_line_ed_index; j++, i++) {
            var last_x = 0;
            var line = this._visobj.lines[j];
            if (!line) continue;
            if (Array.isArray(line.value)) {
               line.value.forEach(function (span) {
                  var line_w = span.width || measureText(_this.editor.pen, span.value).width;
                  var offsetX = x + last_x - viewX;
                  last_x += line_w;
                  if (offsetX + line_w < 0) return;
                  if (offsetX > _this._size.width) return;
                  _this.editor.pen.fillStyle = _this.theme.get(span.theme);
                  _this.editor.pen.fillText(span.value, offsetX, offsetY+(i+1)*line_height);
               });
            } else {
               _this.editor.pen.fillStyle = _this.theme.get(line.theme);
               _this.editor.pen.fillText(line.value, x - viewX, offsetY+(i+1)*line_height);
            }
         }
         this._visualizeVerticalScroll(x-1, y+1, w, h-15, viewY);
         this._visualizeHorizontalScroll(x+1, y-1, w-15, h, viewX);
         this.editor.pen.restore();
      },
      layout: function () {
         var size = this.editor.size();
         this._size.height = size.height;
      },
      getLineWidth: function () {
         if (this.__last_max_w) return this.__last_max_w || 0;
         var w = 0, _this = this;
         this._visobj && this._visobj.lines.forEach(function (line) {
            var __line_max_w = 0;
            if (Array.isArray(line)) {
               line.forEach(function (span) {
                  var rect = measureText(_this.editor.pen, span.value || ' ').width;
                  span.width = rect.width;
                  __line_max_w += span.width;
               });
            } else {
               __line_max_w = measureText(_this.editor.pen, line.value || ' ').width;
            }
            line.width = __line_max_w;
            if (__line_max_w > w) w = __line_max_w;
         });
         this.__last_max_w = w;
         return w;
      },
      size: function (update) {
         if (update) {
            this._size = Object.assign(this._size, update);
         }
         return Object.assign({}, this._size);
      },
      view: function () {
         return { x: this._size.viewLeft || 0, y: this._size.viewTop || 0 };
      },
      getObjectAt: function (x, y) {
         var rx = x + this._size.x;
         var ry = y + this._size.y;
         var obj = null;
         obj = this.scrollbar.vertical;
         if (obj) {
            if (math.xPointRect(rx, ry, obj.sx, obj.sy, obj.sw, obj.sh)) {
               return {
                  type: 'scroll-slide', name: 'v',
                  x: obj.sx, y: obj.sy, w: obj.sw, h: obj.sh
               };
            } else if (math.xPointRect(rx, ry, obj.x, obj.y, obj.w, obj.h)) {
               return {
                  type: 'scroll-bar', name: 'v',
                  x: obj.x, y: obj.y, w: obj.w, h: obj.h
               };
            }
         }
         obj = this.scrollbar.horizontal;
         if (obj) {
            if (math.xPointRect(rx, ry, obj.sx, obj.sy, obj.sw, obj.sh)) {
               return {
                  type: 'scroll-slide', name: 'h',
                  x: obj.sx, y: obj.sy, w: obj.sw, h: obj.sh
               };
            } else if (math.xPointRect(rx, ry, obj.x, obj.y, obj.w, obj.h)) {
               return {
                  type: 'scroll-bar', name: 'h',
                  x: obj.x, y: obj.y, w: obj.w, h: obj.h
               };
            }
         }
         return null;
      },
      dispose: function () {
         this.editor = null;
         this.theme = null;
         this._size = null;
         this._visobj = null;
      }
   };

   window.CodonEditor = CodonEditor;
   window.CodonEditorText = CodonEditorText;
})(window, document);
