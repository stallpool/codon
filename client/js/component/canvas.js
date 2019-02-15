'use strict';
(function (window, document) {
   function CodonCanvas (dom) {
      this.ref_dom = dom;
      this.dom = document.createElement('canvas');
      this.pen = this.dom.getContext('2d');
      this.ref_dom.appendChild(this.dom);
      this.height = 0;
      this.width = 0;
   }
   CodonCanvas.prototype = {
      layout: function () {
         let width = this.ref_dom.offsetWidth;
         let height = this.ref_dom.offsetHeight;
         this.dom.style.width = width + 'px';
         this.dom.style.height = height + 'px';
         this.width = width;
         this.height = height;
      },
      reset: function () {
         this.pen.clearRect(0, 0, this.width, this.height);
      }
   };

   window.CodonCanvas = CodonCanvas;
})(window, document);