'use strict';

(function () {

var env = {};
var ui = {
   btn: {
      prev: dom('#btnPrev'),
      next: dom('#btnNext'),
      new: dom('#btnNew'),
      del: dom('#btnDel'),
      attr: {
         ok: dom('#btnOK'),
         cancel: dom('#btnNO'),
         show: dom('#btnAddAttr')
      },
      link: {
         from: dom('#btnLinkFrom'),
         to: dom('#btnLinkTo'),
         ok: dom('#btnLinkOK'),
         cancel: dom('#btnLinkNO'),
         show: dom('#btnAddLink')
      }
   },
   pnl: {
      attr: dom('#pnlKeyval'),
      attr_edit: dom('#pnlPutAttr'),
      link: dom('#pnlLink'),
      link_edit: dom('#pnlPutLink')
   },
   txt: {
      val: dom('#txtVal'),
      key: dom('#txtKey'),
      nid: dom('#txtLinkNode')
   },
   mask: dom('.mask')
};

function onHashChange() {
   ui.pnl.attr_edit.style.display = 'none';
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
         url: '/v1/graph/link/' + env.nid,
         method: 'DELETE'
      }, function (res) {
         update_uuid(res);
         ajax({
            headers: get_auth_header(),
            url: '/v1/graph/node/' + env.nid,
            method: 'DELETE'
         }, function (res) {
            var json = update_uuid(res);
            ui.mask.style.display = 'none';
            reloadPageToPrevNode(env.nid, function () {
               reloadPageToNextNode(env.nid, function () {
                  ui.mask.style.display = 'none';
                  location.hash = '';
               });
            });
         }, function (e) {
            console.error(e);
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

   ui.btn.attr.ok.addEventListener('click', function (evt) {
      var key = ui.txt.key.value;
      var val = ui.txt.val.value;
      if (!key) return;
      ui.mask.style.display = 'block';
      ui.pnl.attr_edit.style.display = 'none';
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
         ui.pnl.attr_edit.style.display = 'block';
         ui.txt.key.focus();
         console.error(e);
      });
   });
   ui.btn.attr.cancel.addEventListener('click', function (evt) {
      ui.txt.key.value = '';
      ui.txt.val.value = '';
      ui.pnl.attr_edit.style.display = 'none';
   });
   ui.btn.attr.show.addEventListener('click', function (evt) {
      ui.txt.key.value = '';
      ui.txt.val.value = '';
      ui.pnl.attr_edit.style.display = 'block';
      ui.txt.key.focus();
   });

   ui.btn.link.from.addEventListener('click', function (evt) {
      ui.btn.link.from.classList.add('item-green');
      ui.btn.link.to.classList.remove('item-green');
      ui.txt.nid.focus();
   });
   ui.btn.link.to.addEventListener('click', function (evt) {
      ui.btn.link.to.classList.add('item-green');
      ui.btn.link.from.classList.remove('item-green');
      ui.txt.nid.focus();
   });
   ui.btn.link.ok.addEventListener('click', function (evt) {
      var nid = ui.txt.nid.value;
      if (!nid) return;
      ui.mask.style.display = 'block';
      var dito = ui.btn.link.to.classList.contains('item-green');
      var n1 = dito?env.nid:nid;
      var n2 = dito?nid:env.nid;
      ajax({
         headers: get_auth_header(),
         url: '/v1/graph/link/' + n1 + '/' + n2,
         method: 'POST',
      }, function () {
         ui.txt.nid.value = '';
         ui.pnl.link_edit.style.display = 'none';
         updateLinkList(nid, dito);
         ui.mask.style.display = 'none';
      }, function (e) {
         ui.mask.style.display = 'none';
      });
   });
   ui.btn.link.cancel.addEventListener('click', function (evt) {
      ui.txt.nid.value = '';
      ui.pnl.link_edit.style.display = 'none';
   });
   ui.btn.link.show.addEventListener('click', function (evt) {
      ui.txt.nid.value = '';
      ui.btn.link.from.classList.add('item-green');
      ui.btn.link.to.classList.remove('item-green');
      ui.pnl.link_edit.style.display = 'block';
      ui.txt.nid.focus();
   });

   ui.pnl.attr.addEventListener('click', function (evt) {
      if (evt.target.classList.contains('item-btn-edit')) {
         var key = evt.target.textContent;
         var val = evt.target.parentNode.children[1].textContent;
         ui.txt.key.value = key;
         ui.txt.val.value = val;
         ui.pnl.attr_edit.style.display = 'block';
         ui.txt.key.focus();
      }
   });

   ui.pnl.link.addEventListener('click', function (evt) {
      if (evt.target.classList.contains('item-btn-del-link')) {
         var dito = evt.target.textContent.trim() === 'X ->';
         var nid = evt.target.parentNode.children[1].textContent;
         if (!nid) return;
         ui.mask.style.display = 'block';
         var n1 = dito?env.nid:nid;
         var n2 = dito?nid:env.nid;
         ajax({
            headers: get_auth_header(),
            url: '/v1/graph/link/' + n1 + '/' + n2,
            method: 'DELETE'
         }, function (res) {
            var item = evt.target.parentNode;
            item.parentNode.remove(item);
            ui.mask.style.display = 'none';
         }, function (e) {
            console.error(e);
            ui.mask.style.display = 'none';
         });
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

function createLinkItem(nid, dito, odd) {
   var div = document.createElement('div');
   div.classList.add('item');
   if (!odd) div.classList.add('item-grey');
   var a = document.createElement('a');
   a.appendChild(document.createTextNode(dito?'X ->':'X <-'));
   a.classList.add('item-btn');
   a.classList.add('item-red');
   a.classList.add('item-btn-del-link');
   div.appendChild(a);

   var a = document.createElement('a');
   a.classList.add('link-id');
   a.appendChild(document.createTextNode(nid));
   a.href = '#/' + nid;
   div.appendChild(a);
   return div;
}


function reloadPageToFirstNode() {
   reloadPageToNextNode(0, function () {
      alert('No node. Use \'New\' to add one.');
      ui.mask.style.display = 'none';
   });
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
   env.node = null;
   env.nid = -1;
   env.ein = [];
   env.eout = [];

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
   empty_elem(ui.pnl.attr);
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
            key, env.node[key], ui.pnl.attr.children.length % 2
         );
         ui.pnl.attr.appendChild(div);
      }
   });
   env.ein = ein;
   env.eout = eout;
   buildLinkList();
}

function buildLinkList() {
   empty_elem(ui.pnl.link);
   env.ein.forEach(function (nid_from) {
      var div = createLinkItem(nid_from, false, ui.pnl.link.children.length % 2);
      ui.pnl.link.appendChild(div);
   });
   env.eout.forEach(function (nid_to) {
      var div = createLinkItem(nid_to, true, ui.pnl.link.children.length % 2);
      ui.pnl.link.appendChild(div);
   });
}

function updateAttrList(key, val) {
   var ch = ui.pnl.attr.children;
   var ok = false;
   for (let i = 0, n = ch.length; i < n; i++) {
      var key0 = ch[i].children[0].textContent;
      if (key0 !== key) continue;
      if (val) {
         empty_elem(ch[i].children[1]);
         ch[i].children[1].appendChild(document.createTextNode(val));
      } else {
         ui.pnl.attr.removeChild(ch[i]);
      }
      ok = true;
      break;
   }
   if (!ok) {
      var div = createAttrItem(
         key, val, ui.pnl.attr.children.length % 2
      );
      ui.pnl.attr.appendChild(div);
   }
}

function updateLinkList(nid, dito) {
   var div = createLinkItem(nid, dito, ui.pnl.link.children.length % 2);
   ui.pnl.link.appendChild(div);
}

init();

})();
