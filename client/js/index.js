'use strict';
//@include common.js
//@include component/canvas.js

var ui = {
   loading: dom('#p_loading'),
   app: dom('#p_app'),
   editor: new window.CodonEditor(dom('#canvas'))
};

function before_app() {
   ui_loading();
}

function resize() {
   ui.editor.memorize();
   ui.editor.layout();
}

function register_events() {
   window.addEventListener('resize', resize);
}

function init_app() {
   ui_loaded();
   register_events();
   resize();
}

function ui_loading() {
   ui.app.classList.add('hide');
   ui.loading.classList.remove('hide');
}

function ui_loaded() {
   ui.loading.classList.add('hide');
   ui.app.classList.remove('hide');

   let container = ui.editor.dom.parentNode;
   container.style.width = '100%';
   container.style.height = (window.innerHeight - container.offsetTop) + 'px';
   ui.editor.layout();
   ui.editor.paint();
}

var env = {};
login_and_start(env, before_app, init_app);
