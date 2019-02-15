const i_uuid = require('uuid');

const GraphInterface = {
   get_nodes: (node_ids) => new Promise((r, e) => r([])),
   get_links: (link_ids) => new Promise((r, e) => r()),
   get_node: (node_id) => new Promise((r, e) => r({} || null)),
   get_node_link: (node_id) => new Promise((r, e) => r([])),
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
   index_node: (query, node_id) => new Promise((r, e) => r()),
   index_link: (query, link_id) => new Promise((r, e) => r()),
   remove_index_node: (query, node_id) => new Promise((r, e) => r()),
   remove_index_link: (query, node_id) => new Promise((r, e) => r()),
   search: (query) => new Promise((r, e) => r({
      node: [],
      link: [],
   })),
};

module.exports = GraphInterface;
