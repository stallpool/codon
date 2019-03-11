(function (window, document) {
   'use strict';

   /**
    * + Codon Editor
    * |--- LineNumber / OffsetNumber
    * |--- Text
    */

   function measureText(pen, text) {
      return pen.measureText(text);
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
            font: 16
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
      _useDefaultOptions: function () {
         if (this.options.showLineNumbers === undefined) this.options.showLineNumbers = true;
      },
      _adjustLineMarkAndTextWindow: function () {
         var linemark_w = 0;
         if (this.options.showLineNumbers) {
            linemark_w = this.editor_linemark.getLabelWidth() + 10 + 25;
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
      }
   };

   function CodonTheme(_default) {
      this._map = {};
      this._default = _default || 'black';
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
   }
   CodonEditorLineMark.prototype = {
      debug: function () {
         this._visobj = {
            lines: [
               { value: '  1', theme: 'selected' },
               { value: ' 10' },
               { value: '998' },
               { value: '999' }
            ]
         };
      },
      visualize: function () {
         if (!this._size || !this._size.width) return;
         var x = this._size.x || 10;
         var y = this._size.y || 0;
         var line_height = (this._size.font || 16) + 4;
         var _this = this;
         this.theme.setDefault('#4466ff');
         this._visobj && this._visobj.lines.forEach(function (line, i) {
            _this.editor.pen.fillStyle = _this.theme.get(line.theme);
            _this.editor.pen.fillText(line.value, x, y+(i+1)*line_height);
         });
      },
      layout: function () {
         this._size = Object.assign(this._size, this.editor.size());
      },
      getLabelWidth: function (quick) {
         if (quick) return this._last_max_w || 0;
         var w = 0, _this = this;
         this._visobj && this._visobj.lines.forEach(function (line) {
            var rect = measureText(_this.editor.pen, line.value || '');
            if (rect.width > w) w = rect.width;
         });
         this._last_max_w = w;
         return w;
      },
      size: function (update) {
         if (update) {
            this._size = Object.assign(this._size, update);
         }
         return Object.assign({}, this._size);
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
   }
   CodonEditorText.prototype = {
      debug: function () {
         this._visobj = {
            lines: [
               { value: 'Hello World\n' },
               { value: 'abcdefghijklmnopqrstuvwxyz✪\n' },
               { value: '1234567890-=[]\\;\',./\n' },
               { value: '~!@#$%^&*()_+{}|:"<>?\n' }
            ]
         };
      },
      visualize: function() {
         var x = this._size.x || 60;
         var y = this._size.y || 0;
         var line_height = (this._size.font || 16) + 4;
         var _this = this;
         this.theme.setDefault('black');
         this._visobj && this._visobj.lines.forEach(function (line, i) {
            _this.editor.pen.fillStyle = _this.theme.get(line.theme);
            _this.editor.pen.fillText(line.value, x, y+(i+1)*line_height);
         });
      },
      layout: function () {
         this._size = Object.assign(this._size, this.editor.size());
      },
      size: function (update) {
         if (update) {
            this._size = Object.assign(this._size, update);
         }
         return Object.assign({}, this._size);
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