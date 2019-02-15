const i_fs = require('fs');
const i_path = require('path');
const i_uuid = require('uuid');
const i_storage = require('../../utils').Storage;

function id2filename(base_dir, id) {
   let r = [];
   if (id.length >= 3) r.push(id.substring(0, 3));
   if (id.length >= 6) r.push(id.substring(3, 6));
   if (id.length >= 9) r.push(id.substring(6, 9));
   return i_path.join(base_dir, ...r, id, '_');
}

class Cache {
   constructor(capcity) {
      this.capacity = capcity;
      this.size = 0;
      this.cache = {};
   }

   gc(size) {
      // size is a soft limit
      if (this.size + size <= this.capacity) return;
      let keys = Object.keys(this.cache);
      let n = keys.length;
      while (this.size + size > this.capacity && n > 0) {
         let index = ~~(Math.random()*n);
         let key = keys[index];
         let item = this.cache[key];
         delete this.cache[key];
         this.size -= key.length + item.data.length;
         n --;
      }
   }

   load(filename) {
      let item = this.cache[filename];
      if (!item) {
         if (!i_fs.existsSync(filename)) return null;
         data = i_fs.readFileSync(filename);
         gc(data.length + filename.length);
         this.cache[filename] = {
            data,
         };
         item = this.cache[filename];
      }
      return item.data;
   }

   save(filename, data) {
      let item = this.cache[filename];
      let correction = 0;
      if (!item) {
         item = {
            data: []
         };
         correction = filename.length;
      }
      gc(data.length - item.data.length + correction);
      item.data = data;
      this.cache[filename] = item;
      let dir_name = i_path.dirname(filename);
      if (!i_fs.existsSync(dir_name)) i_storage.make_directory(dir_name);
      i_fs.writeFileSync(filename, data);
   }

   remove(filename) {
      this.remove_cache(filename);
      if (!i_fs.existsSync(filename)) return;
      i_fs.unlinkSync(filename);
   }

   remove_cache(filename) {
      let item = this.cache[filename];
      if (!item) return;
      this.size -= item.data.length + filename.length;
      delete this.cache[filename];
   }
}

function node_id_to_filename(base_dir, node_id) {
   return i_path.join(base_dir, id2filename(node_id));
}

function link_id_to_filename(base_dir, link_id) {
   return i_path.join(base_dir, id2filename(link_id));
}

class FileSystemGraph {
   constructor(base_dir, capacity) {
      this.base_dir = base_dir;
      this.capacity = capacity * 1024 * 1024 /* MB => B */;
      this.cache = new Cache();
      this.config = {
         node_dir: i_path.join(this.base_dir, '_node'),
         link_dir: i_path.join(this.base_dir, '_link'),
         index_dir: i_path.join(this.base_dir, '_index'),
      };
   }

   get_node(node_id) {
      return new Promise((r, e) => {
         let filename = node_id_to_filename(this.node_dir, node_id);
         let data = this.cache.load(filename);
         if (data) data = JSON.parse(data);
         r(data);
      });
   }

   create_node(data) {
      let node_id = uuid.v1();
      data = Object.assign({ id: node_id }, data);
      return this.update_node(node_id, data);
   }

   delete_node(node_id) {
      return new Promise((r, e) => {
      });
   }

   update_node(node_id, data) {
      return new Promise((r, e) => {
         let filename = node_id_to_filename(this.node_dir, node_id);
         this.cache.save(filename, data);
         r(data);
      });
   }

   get_link(link_id) {
      return new Promise((r, e) => {
         let filename = link_id_to_filename(this.link_dir, link_id);
         let data = this.cache.load(filename);
         if (data) data = JSON.parse(data);
         r(data);
      });
   }

   create_link(node1_id, node2_id, data) {
      let link_id = uuid.v1();
      data = Object.assign({ id: link_id, from: node1_id, to: node2_id }, data);
      return this.update_link(link_id, data);
   }

   delete_link(link_id) {
      return new Promise((r, e) => r({
         link: {},
         node: []
      }));
   }

   update_link(link_id, data) {
      return new Promise((r, e) => {
         let filename = link_id_to_filename(this.link_dir, link_id);
         this.cache.save(filename, data);
         r(data);
      });
   }

   search(query) {
      return new Promise((r, e) => r({
         node: [],
         link: [],
      }));
   }
};

module.exports = {
   Client: FileSystemGraph,
};
