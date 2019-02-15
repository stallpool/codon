const i_uuid = require('uuid');

const GraphInterface = {
   get_node: (node_id) => new Promise((r, e) => r({} || null)),
   create_node: (data) => new Promise((r, e) => r(
      Object.assign({ id: uuid.v1() }, data)
   )),
   delete_node: (node_id) => new Promise((r, e) => r({
      node: {},
      links: []
   })),
   update_node: (node_id, data) => new Promise((r, e) => r(
      Object.assign({ id: uuid.v1() }, data)
   )),
   get_link: (link_id) => new Promise((r, e) => r({} || null)),
   create_link: (node1_id, node2_id, data) => new Promise((r, e) => r(
      Object.assign({ id: uuid.v1(), from: node1_id, to: node2_id }, data)
   )),
   delete_link: (link_id) => new Promise((r, e) => r({
      link: {},
      node: []
   })),
   update_link: (link_id, data) => new Promise((r, e) => r(
      Object.assign({ id: uuid.v1() }, data)
   )),
   search: (query) => new Promise((r, e) => r({
      node: [],
      link: [],
   })),
};

module.exports = GraphInterface;
