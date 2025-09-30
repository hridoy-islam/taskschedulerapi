import { RequestHandler } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { GroupServices } from "./group.service";
// import { GroupValidation } from "./group.validation";

const createGroup = catchAsync(async (req, res) => {
  // Validate the request body using the Zod schema
  // const zodParsedData = GroupValidation.GroupValidationSchema.parse(req.body);

  const requester = req.user as { _id: string; role: string };
  // Convert the validated data for MongoDB (ObjectId instances where applicable)
  const result = await GroupServices.createGroupIntoDB(req.body, requester);

  // Send a response to the client
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Group is created successfully",
    data: result,
  });
});


const getAllGroup: RequestHandler = catchAsync(async (req, res) => {
    const requester = req.user as { _id: string; role: string };

  const result = await GroupServices.getAllGroupFromDB(req.query, requester);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Groups retrived succesfully",
    data: result,
  });
});
const getSingleGroup = catchAsync(async (req, res) => {
  const requester = req.user as { _id: string; role: string };
  const { id } = req.params;
  const result = await GroupServices.getSingleGroupFromDB(id, requester);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Group is retrieved succesfully",
    data: result,
  });
});
const getGroupsByUserId = catchAsync(async (req, res) => {
  const requester = req.user as { _id: string; role: string };
  const result = await GroupServices.getGroupsByUserId(requester);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Groups are retrieved succesfully",
    data: result,
  });
});

const updateGroup = catchAsync(async (req, res) => {
  const { id } = req.params;
  const requester = req.user as { _id: string; role: string };
  const result = await GroupServices.updateTaskIntoGroup(id, req.body, requester);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Group is updated succesfully",
    data: result,
  });
});

const addGroupMember = catchAsync(async (req, res) => {
  const { groupId, userId } = req.body;
  if (!groupId || !userId) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Please provide groupId and userId",
      data: null,
    });
  }
  const requester = req.user as { _id: string; role: string };
  const result = await GroupServices.addGroupMember(groupId, userId, requester?._id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Member is added to the group",
    data: result,
  });
}
);

const removeGroupMember = catchAsync(async (req, res) => {
  const { groupId, userId } = req.body;
  if (!groupId || !userId) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Please provide groupId and userId",
      data: null,
    });
  }
  const requester = req.user as { _id: string; role: string };
  const result = await GroupServices.removeGroupMember(groupId, userId, requester?._id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Member is removed from the group",
    data: result,
  });
});

const updateUsersRoleInGroup = catchAsync(async (req, res) => {
  const { groupId, userId, role } = req.body;
  if (!groupId || !userId || !role) {
     sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Please provide groupId, userId and role",
      data: null,
    });
  }
  const requester = req.user as { _id: string; role: string };
  const result = await GroupServices.updateUserPermission(groupId, userId,requester?._id, role );
   sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User role is updated",
    data: result,
  });
});

const deleteGroup = catchAsync(async (req, res) => {
  const { id } = req.params;
  const requester = req.user as { _id: string; role: string };
  const result = await GroupServices.deleteGroupFromDB(id, requester);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Group is deleted succesfully",
    data: result,
  });
});

const updateReadMessage = catchAsync(async (req, res) => {
  const { groupId, userId, messageId } = req.body;
  if (!groupId || !userId || !messageId) {
    sendResponse(res, {
      statusCode: httpStatus.BAD_REQUEST,
      success: false,
      message: "Please provide groupId, userId and messageId",
      data: null,
    });
  }

  const result = await GroupServices.updateReadMessage(groupId, userId, messageId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Message is updated",
    data: result,
  });
});

export const GroupControllers = {
  getAllGroup,
  getSingleGroup,
  updateGroup,
  createGroup,
  getGroupsByUserId,
  addGroupMember,
  removeGroupMember,
  updateUsersRoleInGroup,
  deleteGroup,
  updateReadMessage,	
};
