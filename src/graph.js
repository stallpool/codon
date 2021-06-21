const i_keyval = require('./keyval');
const i_ut = require('./util');

const env = {
   processing: false,
};
const queue = [
   /* {
      type: 0=attr, 1=del, 2=add,
      resolve, reject (promise)
      - 2
        id: string
        attr: string
        val: string/array/object(no ref)
      - 1
        id: string
      - 0
        id: undefined
      - -1
        id: undefined
   } */
];

async function next() {
   if (env.processing) return;
   if (!queue.length) return;
   env.processing = true;
   const task = queue.shift();
   try {
      switch (task.type) {
      case 0:
         const node = JSON.parse(await i_keyval.get(task.id));
         if (!node) return;
         if (task.val === undefined) {
            delete node[task.attr];
         } else {
            node[task.attr] = task.val;
         }
         await i_keyval.put(task.id, JSON.stringify(node));
         task.r();
         break;
      case 1:
         // TODO: del link (foreach node in <-id and ->id)
         await i_keyval.del(task.id);
         task.r();
         break;
      case 2:
         const id = `${api._id}`;
         api._id ++;
         await i_keyval.put('_id', `${api._id}`);
         await i_keyval.put(id, '{}');
         task.r(`${id}`);
         break;
      case -1:
         if (api._id > 0) break;
         try {
            api._id = parseInt(await i_keyval.get('_id'));
         } catch (e) {
            api._id = 1;
         }
         break;
      }
   } catch (e) {
      task.e(e);
   } finally {
      env.processing = false;
   }
   next();
}

const api = {
   _id: -1,
   createNode: async () => new Promise((r, e) => {
      if (api._id <= 0) queue.push({ type: -1 });
      queue.push({ type: 2, r, e });
      next();
   }),
   deleteNode: async (id) => new Promise((r, e) => {
      if (api._id <= 0) queue.push({ type: -1 });
      queue.push({ type: 1, id: `${id}`, r, e });
      next();
   }),
   updateNode: async (id, attr, val) => new Promise((r, e) => {
      if (api._id <= 0) queue.push({ type: -1 });
      queue.push({ type: 0, id: `${id}`, attr, val, r, e });
      next();
   }),
   getNode: async (id, attr) => {
      try {
         const node = JSON.parse(await i_keyval.get(`${id}`));
         if (!node) return null;
         if (attr) return node[attr];
         return node;
      } catch (e) {
         return null;
      }
   },
   getLink: async (id) => {
      const node = await api.getNode(id);
      const ein = [], eout = [];
      const r = { in: ein, out: eout };
      if (!node) return r;
      Object.keys(node).forEach((key) => {
         if (key.startsWith('<-')) {
            ein.push(key.substring(2));
         } else if (key.startsWith('->')) {
            eout.push(key.substring(2));
         }
      });
      return r;
   },
   linkToNode: async (idFrom, idTo) => {
      await api.updateNode(`${idFrom}`, `->${idTo}`, '1');
      await api.updateNode(`${idTo}`, `<-${idFrom}`, '1');
   },
   unlinkToNode: async (idFrom, idTo) => {
      await api.updateNode(`${idFrom}`, `->${idTo}`);
      await api.updateNode(`${idTo}`, `<-${idFrom}`);
   },
};

api.webRestful = {
   v1: {
      node: async (req, res, opt) => {
         // TODO: check auth
         const nid = opt.path[0];
         switch (req.method) {
         case 'GET': {
            if (!nid) return i_ut.e404(res);
            const attr = opt.path[1];
            i_ut.rJson(res, await api.getNode(nid, attr));
            break;
         }
         case 'POST':
            i_ut.rJson(res, {
               id: await api.createNode(),
            });
            break;
         case 'PUT': {
            if (!nid) return i_ut.e404(res);
            const attr = opt.path[1];
            const val = i_ut.readRequestBinary(req);
            await api.updateNode(nid, attr || '_', val.toString());
            i_ut.rJson(res, { id: nid });
            break;
         }
         case 'DELETE':
            if (!nid) return i_ut.e404(res);
            await api.deleteNode(json.id);
            i_ut.rJson(res, { id: nid });
            break;
         default:
            i_ut.e405(res);
         }
      }, // node
      link: async (req, res, opt) => {
         // TODO: check auth
         const nid = opt.path[0];
         if (!nid) return i_ut.e404(res);
         switch (req.method) {
         case 'GET':
            i_ut.rJson(res, await api.getLink(nid));
            break;
         case 'POST': {
            const nid_to = opt.path[1];
            if (!nid_to) return i_ut.e404(res);
            await api.linkToNode(nid, nid_to);
            i_ut.rJson(res, { id: nid });
            break;
         }
         case 'DELETE': {
            const nid_to = opt.path[1];
            if (!nid_to) {
               const edges = await api.getLink(nid);
               for (let i = 0, n = edges.in.length; i < n; i++) {
                  await api.unlinkToNode(edges.in[i], nid);
               }
               for (let i = 0, n = edges.out.length; i < n; i++) {
                  await api.unlinkToNode(nid, edges.out[i]);
               }
               i_ut.rJson(res, { id: nid });
               break;
            }
            await api.unlinkToNode(nid, nid_to);
            i_ut.rJson(res, { id: nid });
            break;
         }
         default:
            i_ut.e405(res);
         }
      }, // link
   } // v1
};

module.exports = api;
