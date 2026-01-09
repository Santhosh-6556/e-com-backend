import Node from "../models/node.model.js";
import { generateRecordId } from "../utils/recordId.js";
import { errorResponse, successResponse } from "../utils/response.js";

export const addNode = async (req, res) => {
  try {
    const {
      path,
      parentNode,
      displayPriority,
      identifier,
      shortDescription,
      name,
      status,
    } = req.body;

    // Check duplicate identifier
    const findDuplicate = await Node.findOne({ identifier });
    if (findDuplicate) {
      return errorResponse(res, "Identifier already present", 400);
    }

    // Normalize parentNode input
    let parentData = null;
    if (parentNode) {
      // Handle if frontend sent string, { recordId }, or whole object
      const parentRecordId =
        typeof parentNode === "string" ? parentNode : parentNode.recordId;

      if (parentRecordId) {
        const parent = await Node.findOne({ recordId: parentRecordId });
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

    let nodes = await Node.find();

    if (!Array.isArray(nodes)) nodes = [];

    nodes = nodes.filter((n) => {
      if (identifier && n.identifier !== identifier) return false;
      if (n.status !== true) return false;
      return true;
    });

    nodes.sort((a, b) => {
      if ((a.displayPriority ?? 0) !== (b.displayPriority ?? 0)) {
        return (a.displayPriority ?? 0) - (b.displayPriority ?? 0);
      }
      return (
        (b.creationTime?.getTime?.() || 0) -
        (a.creationTime?.getTime?.() || 0)
      );
    });

    const formattedNodes = nodes.map((node) => ({
      path: node.path,
      parentNode: node.parentNode,
      displayPriority: node.displayPriority,
      identifier: node.identifier,
      shortDescription: node.shortDescription,
      status: node.status,
    }));

    return successResponse(res, "Nodes fetched successfully", formattedNodes);
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Failed to fetch nodes", 500);
  }
};



export const getParentNodes = async (req, res) => {
  try {
    const { identifier } = req.query;

    let nodes = await Node.find();

    if (!Array.isArray(nodes)) nodes = [];

    nodes = nodes.filter((n) => {
      if (n.parentNode !== null) return false;
      if (n.status !== true) return false;
      if (identifier && n.identifier !== identifier) return false;
      return true;
    });

    nodes.sort((a, b) => {
      if ((a.displayPriority ?? 0) !== (b.displayPriority ?? 0)) {
        return (a.displayPriority ?? 0) - (b.displayPriority ?? 0);
      }
      return (
        (b.creationTime?.getTime?.() || 0) -
        (a.creationTime?.getTime?.() || 0)
      );
    });

    return successResponse(res, "Nodes fetched successfully", nodes);
  } catch (error) {
    console.error("GetParentNodes Error:", error);
    return errorResponse(res, "Failed to fetch nodes", 500);
  }
};


export const editNode = async (req, res) => {
  try {
    const {
      recordId,
      path,
      parentNode,
      displayPriority,
      shortDescription,
      identifier,
      status,
    } = req.body;

    if (!recordId) {
      return errorResponse(res, "recordId is required", 400);
    }

    const existingNode = await Node.findOne({ recordId });
    if (!existingNode) {
      return errorResponse(res, "Node not found", 404);
    }

    const updateData = {};

    if (path !== undefined) updateData.path = path;
    if (identifier !== undefined) updateData.identifier = identifier;
    if (displayPriority !== undefined)
      updateData.displayPriority = displayPriority;
    if (shortDescription !== undefined)
      updateData.shortDescription = shortDescription;
    if (status !== undefined) updateData.status = status;

    if (parentNode === null) {
      updateData.parentNode = null;
    } else if (parentNode?.recordId) {
      const parent = await Node.findOne({ recordId: parentNode.recordId });
      if (!parent) {
        return errorResponse(res, "Parent node not found", 404);
      }
      updateData.parentNode = {
        path: parent.path,
        name: parent.name,
        recordId: parent.recordId,
        status: parent.status,
        identifier: parent.identifier,
      };
    }

    updateData.modifiedBy = req.user?.email || "unknown";

    const updatedNode = await Node.updateOne(
      { recordId },
      updateData
    );

    return successResponse(res, "Node updated successfully", updatedNode);
  } catch (error) {
    console.error("Edit Node Error:", error);
    return errorResponse(res, "Failed to update node", 500);
  }
};


export const deleteNode = async (req, res) => {
  try {
    const { recordId } = req.body;

    if (!recordId) {
      return errorResponse(res, "recordId is required to delete node", 400);
    }

    const node = await Node.findOne({ recordId });
    if (!node) return errorResponse(res, "Node not found", 404);
    await Node.deleteOne({ recordId });
    const deleted = node;

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

    const node = await Node.findOne({ recordId });

    if (!node) {
      return errorResponse(res, "Node not found", 404);
    }

    // Manually shape response (D1-safe)
    const formattedNode = {
      recordId: node.recordId,
      path: node.path,
      parentNode: node.parentNode,
      displayPriority: node.displayPriority,
      identifier: node.identifier,
      shortDescription: node.shortDescription,
      status: node.status,
      creator: node.creator,
      modifiedBy: node.modifiedBy,
      creationTime: node.creationTime
        ? node.creationTime.getTime()
        : null,
      lastModified: node.lastModified
        ? node.lastModified.getTime()
        : null,
    };

    return successResponse(
      res,
      "Node fetched successfully",
      formattedNode
    );
  } catch (error) {
    console.error("GetNodeByRecordId Error:", error);
    return errorResponse(res, "Failed to fetch node", 500);
  }
};


export const getAllNodes = async (req, res) => {
  try {
    let nodes = await Node.find();

    if (!Array.isArray(nodes)) nodes = [];

    nodes.sort((a, b) => {
      if ((a.displayPriority ?? 0) !== (b.displayPriority ?? 0)) {
        return (a.displayPriority ?? 0) - (b.displayPriority ?? 0);
      }
      return (
        (b.creationTime?.getTime?.() || 0) -
        (a.creationTime?.getTime?.() || 0)
      );
    });

    return successResponse(res, "All nodes fetched successfully", nodes);
  } catch (error) {
    console.error("GetAllNodes Error:", error);
    return errorResponse(res, "Failed to fetch all nodes", 500);
  }
};

