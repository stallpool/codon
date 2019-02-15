const i_fs = require('fs');
const i_path = require('path');
const i_uuid = require('uuid');
const i_storage = require('../../utils').Storage;

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
         this.gc(data.length + filename.length);
         this.cache[filename] = {
            data,
         };
         item = this.cache[filename];
         this.size += data.length + filename.length;
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
      this.gc(data.length - item.data.length + correction);
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

function generate_uuid() {
   return i_uuid.v1().split('-').join('');
}

function id2filename(base_dir, id) {
   let r = [];
   if (id.length >= 3) r.push(id.substring(0, 3));
   if (id.length >= 6) r.push(id.substring(3, 6));
   if (id.length >= 9) r.push(id.substring(6, 9));
   return i_path.join(base_dir, ...r, id, '_');
}

function node_id_to_filename(base_dir, node_id) {
   return id2filename(base_dir, node_id);
}

function link_id_to_filename(base_dir, link_id) {
   return base_dir, id2filename(base_dir, link_id);
}

function node_id_to_links_dirname(base_dir, node_id) {
   return node_id_to_filename(base_dir, node_id) + 'links';
}

function link_id_to_nodes_dirname(base_dir, link_id) {
   return link_id_to_filename(base_dir, link_id) + 'nodes';
}

function touch(filename, data) {
   let dir_name = i_path.dirname(filename);
   if (!i_fs.existsSync(dir_name)) i_storage.make_directory(dir_name);
   return i_fs.writeFileSync(filename, data || '');
}
/**
 * /path/_node/<id>/_
 * /path/_node/<id>/_links/...
 * /path/_link/<id>/_
 * /path/_link/<id>/_nodes/...
 */
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
         let filename = node_id_to_filename(this.config.node_dir, node_id);
         let data = this.cache.load(filename);
         if (data) data = JSON.parse(data);
         r(data);
      });
   }

   create_node(data) {
      let node_id = generate_uuid();
      data = Object.assign({ id: node_id }, data);
      return this.update_node(node_id, data);
   }

   delete_node(node_id) {
      return new Promise((r, e) => {
         let dir_name, map = {};
         dir_name = node_id_to_links_dirname(this.config.node_dir, node_id);
         let link_filenames = i_storage.list_files(dir_name);
         let link_ids = link_filenames.map((x) => x.split('/').pop());
         let related_node_ids = link_ids.map((x) => {
            let filename = link_id_to_filename(this.config.link_dir, x);
            let item = JSON.parse(i_fs.readFileSync(filename));
            if (item.from === node_id) {
               return {
                  node_id: item.to,
                  link_id: x,
               };
            } else if (item.to === node_id) {
               return {
                  node_id: item.from,
                  link_id: x,
               };
            } else {
               // A -> A
               return null;
            }
         }).filter((x) => !!x);
         related_node_ids.forEach((pair) => {
            let dir_name = node_id_to_links_dirname(this.config.node_dir, pair.node_id);
            i_fs.unlinkSync(i_path.join(dir_name, pair.link_id));
            map[pair.link_id] = 1;
         });
         let links = Object.keys(map).map((link_id) => {
            let filename = link_id_to_filename(this.config.link_dir, link_id);
            let link_item = JSON.parse(i_fs.readFileSync(filename));
            let dir_name = i_path.dirname(filename);
            i_storage.remove_directory(dir_name);
            return link_item;
         });
         let filename = node_id_to_filename(this.config.node_dir, node_id);
         let node_item = JSON.parse(i_fs.readFileSync(filename));
         dir_name = i_path.dirname(filename);
         i_storage.remove_directory(dir_name);
         r({
            node: node_item,
            link: links,
         });
      });
   }

   update_node(node_id, data) {
      // should not change id
      return new Promise((r, e) => {
         let filename = node_id_to_filename(this.config.node_dir, node_id);
         let data_origin = this.cache.load(filename);
         if (data_origin) {
            data_origin = Object.assign(JSON.parse(data_origin), data);
         }
         this.cache.save(filename, JSON.stringify(data));
         r(data);
      });
   }

   get_link(link_id) {
      return new Promise((r, e) => {
         let filename = link_id_to_filename(this.config.link_dir, link_id);
         let data = this.cache.load(filename);
         if (data) data = JSON.parse(data);
         r(data);
      });
   }

   create_link(node1_id, node2_id, data) {
      return new Promise((r, e) => {
         let link_id = generate_uuid();
         let node1_filename, node2_filename;
         node1_filename = node_id_to_filename(this.config.node_dir, node1_id);
         node2_filename = node_id_to_filename(this.config.node_dir, node2_id);
         if (!data) data = {};
         if (!i_fs.existsSync(node1_filename) || !i_fs.existsSync(node2_filename)) {
            return e([node1_id, node2_id]);
         }
         data = Object.assign({ id: link_id, from: node1_id, to: node2_id }, data);
         this.update_link(link_id, data).then((data) => {
            let dir_name, filename;
            dir_name = node_id_to_links_dirname(this.config.node_dir, node1_id);
            filename = i_path.join(dir_name, link_id);
            touch(filename);
            dir_name = node_id_to_links_dirname(this.config.node_dir, node2_id);
            filename = i_path.join(dir_name, link_id);
            touch(filename);
            r(data);
         }, e);
      });
   }

   delete_link(link_id) {
      return new Promise((r, e) => {
         let filename = link_id_to_filename(this.config.link_dir, link_id);
         let link_item = JSON.parse(i_fs.readFileSync(filename));
         let from_node_id = link_item.from;
         let to_node_id = link_item.to;
         let dir_name = i_path.dirname(filename);
         i_storage.remove_directory(dir_name, this.base_dir);

         let from_node_item, to_node_item;
         filename = node_id_to_filename(this.config.node_dir, from_node_id);
         from_node_item = JSON.parse(i_fs.readFileSync(filename));
         dir_name = node_id_to_links_dirname(this.config.node_dir, from_node_id);
         i_fs.unlinkSync(i_path.join(dir_name, link_id));
         if (from_node_id !== to_node_id) {
            filename = node_id_to_filename(this.config.node_dir, to_node_id);
            to_node_item = JSON.parse(i_fs.readFileSync(filename));
            dir_name = node_id_to_links_dirname(this.config.node_dir, to_node_id);
            i_fs.unlinkSync(i_path.join(dir_name, link_id));
         }
         r({
            link: link_item,
            node: [from_node_item, to_node_item],
         });
      });
   }

   update_link(link_id, data) {
      // should not change id, from, to
      return new Promise((r, e) => {
         let filename = link_id_to_filename(this.config.link_dir, link_id);
         let data_origin = this.cache.load(filename);
         if (data_origin) {
            data_origin = Object.assign(JSON.parse(data_origin), data);
         }
         this.cache.save(filename, JSON.stringify(data));
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
