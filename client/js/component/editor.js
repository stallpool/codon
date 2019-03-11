(function (window, document) {
   'use strict';

   /**
    * + Codon Editor
    * |--- LineNumber / OffsetNumber
    * |--- Text
    */

   function CodonEditor(dom, options) {
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

      this.options = options || {};
      this._useDefaultOptions();
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
         this.editor_linemark.layout();
         this.editor_text.layout();
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
      visualize: function (vis_objects) {
         vis_objects = {
            lines: [
               { value: '  1', theme: 'selected' },
               { value: ' 10' },
               { value: '998' },
               { value: '999' }
            ]
         };
         this._visobj = vis_objects;
         var x = this._size.x || 10;
         var y = this._size.y || 0;
         var line_height = (this._size.font || 16) + 4;
         var _this = this;
         this.theme.setDefault('#4466ff');
         vis_objects.lines.forEach(function (line, i) {
            _this.editor.pen.fillStyle = _this.theme.get(line.theme);
            _this.editor.pen.fillText(line.value, x, y+(i+1)*line_height);
         });
      },
      layout: function () {
         this._size = Object.assign(this._size, this.editor.size());
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
      visualize: function(vis_objects) {
         vis_objects = {
            lines: [
               { value: 'Hello World\n' },
               { value: 'abcdefghijklmnopqrstuvwxyz✪\n' },
               { value: '1234567890-=[]\\;\',./\n' },
               { value: '~!@#$%^&*()_+{}|:"<>?\n' }
            ]
         };
         this._visobj = vis_objects;
         var x = this._size.x || 60;
         var y = this._size.y || 0;
         var line_height = (this._size.font || 16) + 4;
         var _this = this;
         this.theme.setDefault('black');
         vis_objects.lines.forEach(function (line, i) {
            _this.editor.pen.fillStyle = _this.theme.get(line.theme);
            _this.editor.pen.fillText(line.value, x, y+(i+1)*line_height);
         });
      },
      layout: function () {
         this._size = Object.assign(this._size, this.editor.size());
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