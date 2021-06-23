'use strict';

(function () {

var env = {};
var ui = {
   btn: {
      prev: dom('#btnPrev'),
      next: dom('#btnNext'),
      new: dom('#btnNew'),
      del: dom('#btnDel'),
      keyval: {
         ok: dom('#btnOK'),
         cancel: dom('#btnNO'),
         shide: dom('#btnAddAttr')
      }
   },
   pnl: {
      keyval: dom('#pnlKeyval'),
      attr: dom('#pnlPutAttr')
   },
   txt: {
      val: dom('#txtVal'),
      key: dom('#txtKey')
   },
   mask: dom('.mask')
};

function onHashChange() {
   ui.pnl.attr.style.display = 'none';
   loadNode();
}

function init() {
   initEvent();
   if (location.hash) {
      loadNode();
   } else {
      reloadPageToFirstNode();
   }
}

function initEvent() {
   window.addEventListener('hashchange', onHashChange);
   ui.btn.new.addEventListener('click', function (evt) {
      ui.mask.style.display = 'block';
      ajax({
         headers: get_auth_header(),
         url: '/v1/graph/node/',
         method: 'POST'
      }, function (res) {
         var json = update_uuid(res);
         ui.mask.style.display = 'none';
         location.hash = '#/' + json.id;
      }, function (e) {
         console.error(e);
      });
   });
   ui.btn.del.addEventListener('click', function (evt) {
      ui.mask.style.display = 'block';
      ajax({
         headers: get_auth_header(),
         url: '/v1/graph/node/' + env.nid,
         method: 'DELETE'
      }, function (res) {
         var json = update_uuid(res);
         ui.mask.style.display = 'none';
         reloadPageToPrevNode(env.nid, function () {
            reloadPageToNextNode(env.nid)
         });
      }, function (e) {
         console.error(e);
      });
   });
   ui.btn.next.addEventListener('click', function (evt) {
      reloadPageToNextNode(env.nid, function () {
         alert('This is the last node.');
         ui.mask.style.display = 'none';
      });
   });
   ui.btn.prev.addEventListener('click', function (evt) {
      reloadPageToPrevNode(env.nid, function () {
         alert('This is the first node.');
         ui.mask.style.display = 'none';
      });
   });
   ui.btn.keyval.ok.addEventListener('click', function (evt) {
      var key = ui.txt.key.value;
      var val = ui.txt.val.value;
      if (!key) return;
      ui.mask.style.display = 'block';
      ui.pnl.attr.style.display = 'none';
      ajax({
         headers: get_auth_header(),
         url: '/v1/graph/node/' + env.nid + '/' + encodeURIComponent(key),
         method: 'PUT',
         raw: val
      }, function (res) {
         ui.txt.key.value = '';
         ui.txt.val.value = '';
         update_uuid(res);
         updateAttrList(key, val);
         ui.mask.style.display = 'none';
      }, function (e) {
         ui.pnl.attr.style.display = 'block';
         ui.txt.key.focus();
         console.error(e);
      });
   });
   ui.btn.keyval.cancel.addEventListener('click', function (evt) {
      ui.txt.key.value = '';
      ui.txt.val.value = '';
      ui.pnl.attr.style.display = 'none';
   });
   ui.btn.keyval.shide.addEventListener('click', function (evt) {
      ui.txt.key.value = '';
      ui.txt.val.value = '';
      ui.pnl.attr.style.display = 'block';
      ui.txt.key.focus();
   });
   ui.pnl.keyval.addEventListener('click', function (evt) {
      if (evt.target.classList.contains('item-btn-edit')) {
         var key = evt.target.textContent;
         var val = evt.target.parentNode.children[1].textContent;
         ui.txt.key.value = key;
         ui.txt.val.value = val;
         ui.pnl.attr.style.display = 'block';
         ui.txt.key.focus();
      }
   });
}

function createAttrItem(key, val, odd) {
   var div = document.createElement('div');
   div.classList.add('item');
   if (!odd) div.classList.add('item-grey');
   var a = document.createElement('a');
   a.appendChild(document.createTextNode(key));
   a.classList.add('item-btn');
   a.classList.add('item-btn-edit');
   div.appendChild(a);

   var span = document.createElement('pre');
   span.appendChild(document.createTextNode(val));
   div.appendChild(span);
   return div;
}


function reloadPageToFirstNode() {
   reloadPageToNextNode(0);
   // TODO: no first node
}

function reloadPageToNextNode(id, failFn) {
   ui.mask.style.display = 'block';
   ajax({
      headers: get_auth_header(),
      url: '/v1/graph/node_next/' + id,
      method: 'GET'
   }, function (res) {
      var json = update_uuid(res);
      ui.mask.style.display = 'none';
      location.hash = '#/' + json.id;
   }, function (e) {
      failFn && failFn(e);
   });
}

function reloadPageToPrevNode(id, failFn) {
   ui.mask.style.display = 'block';
   ajax({
      headers: get_auth_header(),
      url: '/v1/graph/node_prev/' + id,
      method: 'GET'
   }, function (res) {
      var json = update_uuid(res);
      ui.mask.style.display = 'none';
      location.hash = '#/' + json.id;
   }, function (e) {
      failFn && failFn(e);
   });
}

function loadNode() {
   ui.mask.style.display = 'block';
   var parts = location.hash.split('/');
   var nid = parseInt(parts[1], 10);
   if (nid < 0 || !nid) {
      reloadPageToFirstNode();
      return;
   }
   ajax({
      headers: get_auth_header(),
      url: '/v1/graph/node/' + nid,
      method: 'GET'
   }, function (res) {
      env.nid = nid;
      var json = update_uuid(res);
      env.node = json;
      buildAttrList();
      ui.mask.style.display = 'none';
   }, function (e) {
      console.error(e);
   });
}

function buildAttrList() {
   empty_elem(ui.pnl.keyval);
   if (!env.node) return;
   var keys = Object.keys(env.node);
   var ein = [], eout = [];
   keys.forEach(function (key) {
      if (key.startsWith('->')) {
         eout.push(key.substring(2));
      } else if (key.startsWith('<-')) {
         ein.push(key.substring(2));
      } else {
         var div = createAttrItem(
            key, env.node[key], ui.pnl.keyval.children.length % 2
         );
         ui.pnl.keyval.appendChild(div);
      }
   });
}

function updateAttrList(key, val) {
   var ch = ui.pnl.keyval.children;
   var ok = false;
   for (let i = 0, n = ch.length; i < n; i++) {
      var key0 = ch[i].children[0].textContent;
      if (key0 !== key) continue;
      if (val) {
         empty_elem(ch[i].children[1]);
         ch[i].children[1].appendChild(document.createTextNode(val));
      } else {
         ui.pnl.keyval.removeChild(ch[i]);
      }
      ok = true;
      break;
   }
   if (!ok) {
      var div = createAttrItem(
         key, val, ui.pnl.keyval.children.length % 2
      );
      ui.pnl.keyval.appendChild(div);
   }
}

init();

})();
