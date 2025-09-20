import Node from "../models/node.controller.js";
import { generateRecordId } from "../utils/recordId.js";
import { errorResponse, successResponse } from "../utils/response.js";

export const addNode = async (req, res) => {
  try {
    const { path, parentNode, displayPriority, identifier, shortDescription, name, status } = req.body;

    // Check duplicate identifier
    const findDuplicate = await Node.findOne({ identifier });
    if (findDuplicate) {
      return errorResponse(res, "Identifier already present", 400);
    }

    // Resolve parentNode if recordId is sent
    let parentData = null;
    if (parentNode?.recordId) {
      const parent = await Node.findOne({ recordId: parentNode.recordId });
      if (!parent) {
        return errorResponse(res, "Parent node not found", 404);
      }
      parentData = {
        path: parent.path,
        name: parent.name,
        recordId: parent.recordId,
        status: parent.status,
        identifier: parent.identifier,
      };
    }

    const userEmail = req.user?.email || "unknown";

  
    const newNode = await Node.create({
      path,
      parentNode: parentData,
      displayPriority,
      identifier,
      shortDescription,
      name,
      status: status ?? true,
      creator: userEmail,
      modifiedBy: userEmail,
      recordId: generateRecordId(),
    });

    return successResponse(res, "Node created successfully", newNode);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export const getNodeMenuData = async (req, res) => {
  try {

    const { identifier } = req.query;
    const filter = identifier ? { identifier } : {};

    const nodes = await Node.find(filter)
      .sort({ displayPriority: 1, creationTime: -1 })
      .select(
        "path parentNode displayPriority identifier shortDescription status"
      );

    return successResponse(res, "Nodes fetched successfully", nodes);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Failed to fetch nodes", 500);
  }
};

export const getAllNodes = async (req, res) => {
  try {
    const { identifier } = req.query;

    
    const filter = { parentNode: null };
    if (identifier) {
      filter.identifier = identifier;
    }

    const nodes = await Node.find(filter).sort({ displayPriority: 1, creationTime: -1 });


    const formattedNodes = nodes.map(node => ({
      recordId: node.recordId,
      description: node.shortDescription || null,
      id: {
        timestamp: Number(node.recordId),
        date: Number(node.recordId) * 1000, 
      },
      creator: node.createdBy || null,
      status: node.status,
      creationTime: node.creationTime ? node.creationTime.getTime() : null,
      lastModified: node.lastModified ? node.lastModified.getTime() : null,
      modifiedBy: node.modifiedBy || null,
      identifier: node.identifier,
      name: node.name,
      path: node.path,
      roles: null,
      parentNode: node.parentNode ? node.parentNode : null,
      childNodes: null,
      displayPriority: node.displayPriority,
    }));

    return successResponse(res, "Nodes fetched successfully", formattedNodes);
  } catch (error) {
    console.error("GetAllNodes Error:", error);
    return errorResponse(res, "Failed to fetch nodes", 500);
  }
};



export const editNode = async (req, res) => {
  try {
    const { path, parentNode, displayPriority, shortDescription, identifier } =
      req.body;

    // Check if identifier is provided
    if (!identifier) {
      return errorResponse(res, "Identifier is required to edit node", 400);
    }

    // Find node by identifier
    const node = await Node.findOne({ identifier });
    if (!node) {
      return errorResponse(res, "Node not found", 404);
    }

    // Update fields
    node.path = path ?? node.path;
    node.identifier = identifier ?? node.identifier;
    node.parentNode = parentNode ?? node.parentNode;
    node.displayPriority = displayPriority ?? node.displayPriority;
    node.shortDescription = shortDescription ?? node.shortDescription;

    // Track who modified
    node.modifiedBy = req.user?.email || "unknown";

    await node.save();

    return successResponse(res, "Node updated successfully", node);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Failed to update node", 500);
  }
};

export const deleteNode = async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) {
      return errorResponse(res, "recordId is required to delete node", 400);
    }

   
    const node = await Node.findOneAndDelete({ recordId });

    if (!node) {
      return errorResponse(res, "Node not found", 404);
    }

    return successResponse(res, "Node deleted successfully", node);
  } catch (error) {
    console.error("Delete Node Error:", error);
    return errorResponse(res, "Failed to delete node", 500);
  }
};


export const getNodeByRecordId = async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) {
      return errorResponse(res, "recordId is required", 400);
    }

    // Find the node by recordId
    const node = await Node.findOne({ recordId })
      .select(
        "recordId path parentNode displayPriority identifier shortDescription status createdBy modifiedBy creationTime lastModified"
      );

    if (!node) {
      return errorResponse(res, "Node not found", 404);
    }

    return successResponse(res, "Node fetched successfully", node);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Failed to fetch node", 500);
  }
};

