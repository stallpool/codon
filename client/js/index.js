'use strict';
//@include common.js

var ui = {
   loading: dom('#p_loading'),
   app: {
      self: dom('#p_app')
   }
};

function before_app() {
   ui_loading();
}

function init_app() {
   ui_loaded();
}

function ui_loading() {
   ui.app.self.classList.add('hide');
   ui.loading.classList.remove('hide');
}

function ui_loaded() {
   ui.loading.classList.add('hide');
   ui.app.self.classList.remove('hide');
}

var env = {};
login_and_start(env, before_app, init_app);
