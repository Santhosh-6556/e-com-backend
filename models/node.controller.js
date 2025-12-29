// Node model for D1 database
import { getD1 } from "../config/d1.js";

const rowToNode = (row) => {
  if (!row) return null;
  return {
    recordId: row.recordId,
    path: row.path,
    parentNode: row.parentNodeRecordId
      ? {
          path: row.parentNodePath,
          name: row.parentNodeName,
          recordId: row.parentNodeRecordId,
          status: row.parentNodeStatus === 1,
          identifier: row.parentNodeIdentifier,
        }
      : null,
    displayPriority: row.displayPriority || 0,
    status: row.status === 1,
    creationTime: row.creationTime
      ? new Date(row.creationTime * 1000)
      : new Date(),
    lastModified: row.lastModified
      ? new Date(row.lastModified * 1000)
      : new Date(),
    identifier: row.identifier,
    name: row.name,
    shortDescription: row.shortDescription,
    creator: row.creator,
    modifiedBy: row.modifiedBy,
    _class: row._class || "com.VijayLamps.lamps.model.Node",
  };
};

class NodeModel {
  constructor() {
    this.db = getD1();
  }

  async findOne(filter) {
    const node = await this.db.findOne("nodes", filter);
    return node ? rowToNode(node) : null;
  }

  async find(filter = {}, options = {}) {
    const nodes = await this.db.find("nodes", filter, options);
    return nodes.map(rowToNode);
  }

  async create(data) {
    const now = Math.floor(Date.now() / 1000);
    const nodeData = {
      recordId: data.recordId,
      path: data.path,
      parentNodePath: data.parentNode?.path || null,
      parentNodeName: data.parentNode?.name || null,
      parentNodeRecordId: data.parentNode?.recordId || null,
      parentNodeStatus: data.parentNode?.status ? 1 : null,
      parentNodeIdentifier: data.parentNode?.identifier || null,
      displayPriority: data.displayPriority || 0,
      status: data.status !== false ? 1 : 0,
      identifier: data.identifier,
      name: data.name || null,
      shortDescription: data.shortDescription || null,
      creator: data.creator,
      modifiedBy: data.modifiedBy || null,
      _class: data._class || "com.VijayLamps.lamps.model.Node",
      creationTime: now,
      lastModified: now,
    };
    await this.db.insertOne("nodes", nodeData);
    return this.findOne({ recordId: data.recordId });
  }

  async updateOne(filter, update) {
    const updateData = {
      ...update,
      lastModified: Math.floor(Date.now() / 1000),
    };
    if (update.parentNode) {
      updateData.parentNodePath = update.parentNode.path;
      updateData.parentNodeName = update.parentNode.name;
      updateData.parentNodeRecordId = update.parentNode.recordId;
      updateData.parentNodeStatus = update.parentNode.status ? 1 : 0;
      updateData.parentNodeIdentifier = update.parentNode.identifier;
      delete updateData.parentNode;
    }
    if (update.status !== undefined) updateData.status = update.status ? 1 : 0;
    await this.db.updateOne("nodes", filter, updateData);
    return this.findOne(filter);
  }

  async deleteOne(filter) {
    await this.db.deleteOne("nodes", filter);
    return true;
  }
}

let nodeModelInstance = null;

export default {
  findOne: async (filter) => {
    if (!nodeModelInstance) nodeModelInstance = new NodeModel();
    return nodeModelInstance.findOne(filter);
  },
  find: async (filter, options) => {
    if (!nodeModelInstance) nodeModelInstance = new NodeModel();
    return nodeModelInstance.find(filter, options);
  },
  create: async (data) => {
    if (!nodeModelInstance) nodeModelInstance = new NodeModel();
    return nodeModelInstance.create(data);
  },
  updateOne: async (filter, update) => {
    if (!nodeModelInstance) nodeModelInstance = new NodeModel();
    return nodeModelInstance.updateOne(filter, update);
  },
  deleteOne: async (filter) => {
    if (!nodeModelInstance) nodeModelInstance = new NodeModel();
    return nodeModelInstance.deleteOne(filter);
  },
};
