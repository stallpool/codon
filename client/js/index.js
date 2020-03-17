'use strict';
//@include common.js

var ui = {
   loading: dom('#p_loading'),
   app: dom('#p_app'),
};

function before_app() {
   ui_loading();
}

function resize() {
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
}

var env = {};
login_and_start(env, before_app, init_app);
