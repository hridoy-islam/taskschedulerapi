import httpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import { GroupSearchableFields } from "./group.constant";
import { TGroup } from "./group.interface";
import { Group } from "./group.model";
import AppError from "../../errors/AppError";
import { User } from "../user/user.model";
import moment from "moment";
import mongoose from "mongoose";
import { GroupMessage } from "../groupMessage/message.model";
import { NotificationService } from "../notification/notification.service";
import { getIO } from "../../../socket";


const createGroupIntoDB = async (payload: TGroup, requester : any) => {
  // Fetch the author/creator by ID
  const author = await User.findById(payload.creator);

  // Check for validity of each member's userId in payload
  const memberIds = payload.members.map((member) => member._id);
  const members = await User.find({ _id: { $in: memberIds } });

  // Return error if author or members not found
  if (!author || members.length !== payload.members.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Author or some Members not found"
    );
  }

  // Create an array of members with role assignment, setting creator as admin
  const membersWithRole = payload.members.map((member) => ({
    _id: member._id,
    role: (member._id == new mongoose.Types.ObjectId(payload.creator))
      ? "admin"
      : "member",
    acceptInvitation: member.acceptInvitation || false,
    lastMessageReadId: member.lastMessageReadId || null,
  }));

  // Create group in database with the full payload and formatted members
  const result = await Group.create({
    ...payload,
    members: membersWithRole,
  });
  
  // Step 2: Create a notification for the group members excluding the creator
  const notificationMessage = `${author.name} Added you in group "${result.groupName}"`;

  // Create notifications for all members except the creator
  const notifications = await Promise.all(
    payload.members.map(async (member) => {
      if (member._id.toString() !== author._id.toString()) {
        return await NotificationService.createNotificationIntoDB({
          userId: member._id, // User receiving the notification
          senderId: author._id, // User creating the group
          type: "group",
          message: notificationMessage,
          docId: result._id.toString()
        });
      }
    })
  );

  // Step 3: Send the notification in real-time using WebSocket for each member
  const io = getIO();

  payload.members.forEach((member) => {
    if (member._id.toString() !== author._id.toString()) {
      const memberId = member._id.toString();
      io.to(memberId).emit("notification", notifications.find(
        (notification) => notification?.userId.toString() === memberId
      ));
    }
  });

  return result;
};



const getAllGroupFromDB = async (query: Record<string, unknown>, requester: any) => {
  // check if the user is admin or not from User model
  const isAdmin = await User.findById(requester._id);
  if (!isAdmin) {
    throw new AppError(httpStatus.FORBIDDEN, "You are not authorized");
  }
  const groupQuery = new QueryBuilder(
    Group.find().populate("groupName status members"), // Populate relevant fields
    query
  )
    .search(GroupSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await groupQuery.countTotal();
  const result = await groupQuery.modelQuery;

  return {
    meta,
    result,
  };
};

const getGroupsByUserId = async (userData: any) => {
  const { _id } = userData; // Assuming `_id` is passed as the user's ObjectId

  // Verify that `_id` exists in the input
  if (!_id) {
    throw new AppError(httpStatus.BAD_REQUEST, "User ID is required");
  }

  // Fetch the user by ID to confirm they exist
  const user = await User.findById(_id);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }
  // console.log(`User found: ${user}`);

  // Ensure `user._id` is of type `ObjectId`
  const userObjectId = mongoose.Types.ObjectId.isValid(_id)
    ? new mongoose.Types.ObjectId(_id)
    : null;

  if (!userObjectId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid User ID format");
  }

  // Fetch groups where the user is a member
  const groups = await Group.find({
    "members._id": userObjectId, // Ensure proper matching with ObjectId
  });

  // get the message count for each group
  const groupWithMessageCount = await Promise.all(groups.map(async (group) => {
    const member = group.members.find((m) => m._id.toString() === userObjectId.toString());
    const lastMessageReadId = member ? member.lastMessageReadId : null;

    const unreadMessageCount = await GroupMessage.countDocuments({
      taskId: group._id,
      _id: { $gt: lastMessageReadId },
    });

    return {
      ...group.toObject(),
      unreadMessageCount,
    };
  }));


  if (!groups.length) {
    // console.log("No groups found for the user.");
    return [];
  } 
  
  // else {
  //   console.log(`Groups found: ${groups.map((group) => group.groupName)}`);
  // }
  return groupWithMessageCount;
};


const getSingleGroupFromDB = async (id: string, requester: any) => {
  // Check if the user is a member of the group
  const isMember = await Group.findOne({
    _id: id,
    "members._id": requester._id,
  });

  if (!isMember) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not a member of the group"
    );
  }

  // Fetch the group by ID and populate member details
  const groupData = await Group.findById(id).populate({
    path: "members._id",
    select: "name email image",
    transform: (user) => (user ? { name: user.name, email: user.email, _id:user._id, image: user.image } : null),
  });

  if (!groupData) {
    throw new AppError(httpStatus.NOT_FOUND, "Group not found");
  }

  // get group message count
  const messageCount = await GroupMessage.countDocuments({
    taskId: groupData._id,
  });

  // Restructure the `members` array to move populated data outside `_id`
  const updatedMembers = groupData.members.map((member) => {
    const userDetails = member._id; // This contains the populated `name` and `email`
    return {
      _id: member._id._id, // Retain original `_id` if not populated
      name:
        userDetails && typeof userDetails === "object" && "name" in userDetails
          ? userDetails.name
          : null,
      email:
        userDetails && typeof userDetails === "object" && "email" in userDetails
          ? userDetails.email
          : null,
      image: typeof userDetails === "object" && "image" in userDetails
      ? userDetails.image: null,
      role: member.role,
      acceptInvitation: member.acceptInvitation,
      lastMessageReadId: member.lastMessageReadId,
     
    };
  });

  // Return structured group data
  return {
    _id: groupData._id,
    groupName: groupData.groupName,
    description: groupData.description,
    creator: groupData.creator,
    status: groupData.status,
    members: updatedMembers,
    createdAt: groupData.createdAt,
    updatedAt: groupData.updatedAt,
    messageCount,
    image: groupData.image
    
  };
};



const updateTaskIntoGroup = async (id: string, payload: Partial<TGroup>, requester: any) => {
  // Fetch the existing task to get its createdAt date
  const existingTask = await Group.findById(id);
  if (!existingTask) {
    throw new AppError(httpStatus.NOT_FOUND, "Task Not Found");
  }

  // check whether the creator is admin or not
  const isCreatorAdmin = existingTask.members.find(
    (member) => member?._id?.toString() === requester._id
  )?.role === "admin" || "company" || "creator" ||"member";

  // If the creator is not an admin, return an error
  if (!isCreatorAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only Admin can update the task"
    );
  }

  const { groupName, description, status} = payload;
  // If isArchived is true, force status to "archived"
  // const updatedStatus = isArchived ? "archived" : status || "active";

  const upDatedInfo = { groupName, description, status };

  // Update the task in the database
  const result = await Group.findByIdAndUpdate(id, upDatedInfo, {
    new: true,
    runValidators: true,
    upsert: true,
    
  });

  return result;
};

const addGroupMember = async (groupId: string, userId: string, adminId: string) => {
  // Fetch the group by ID
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, "Group Not Found");
  }

  // check whether the creator is admin or not
  const isAdmin = group.members.find(
    (member) => member?._id?.toString() === adminId
  )?.role === "admin";

  // If the creator is not an admin, return an error
  if (!isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only Admin can add members to the group"
    );
  }

  // Fetch the user by ID
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  // Check if the user is already a member of the group
  const isMember = group.members.find(
    (member) => member._id.toString() === userId
  );
  if (isMember) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is already a member");
  }

  // Add the user to the group
  group.members.push({
    _id: user._id,
    role: "member",
    acceptInvitation: false,
    lastMessageReadId: null,
  });

  // Save the updated group 
  const result = await group.save();
  return result;
}

const removeGroupMember = async (groupId: string, userId: string, adminId: string) => {
  // Fetch the group by ID
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, "Group Not Found");
  }

  // check whether the creator is admin or not
  const isAdmin = group.members.find(
    (member) => member?._id?.toString() === adminId
  )?.role === "admin";

  // If the creator is not an admin, return an error
  if (!isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only Admin can remove members from the group"
    );
  }

  // Fetch the user by ID
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  // Check if the user is a member of the group
  const isMember = group.members.find(
    (member) => member._id.toString() === userId
  );
  if (!isMember) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not a member");
  }

  if (group.creator.toString() === userId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Oops! Group creator cannot be removed"
    );
  }

  // Remove the user from the group
  group.members = group.members.filter(
    (member) => member._id.toString() !== userId
  );

  // Save the updated group
  const result = await group.save();
  return result;
}

const updateUserPermission = async (groupId: string, userId: string, adminId: string, role: "admin" | "member") => {
  // Fetch the group by ID
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, "Group Not Found");
  }

  // check whether the creator is admin or not
  const isAdmin = group.members.find(
    (member) => member?._id?.toString() === adminId
  )?.role === "admin";

  // If the creator is not an admin, return an error
  if (!isAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only Admin can update user permissions"
    );
  }

  // Fetch the user by ID
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  // Check if the user is a member of the group
  const isMember = group.members.find(
    (member) => member._id.toString() === userId
  );
  if (!isMember) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not a member");
  }

  // only group.creator can change the role of the group from admin to member
  if (group.creator.toString() === userId && role === "member") {
    throw new AppError(httpStatus.BAD_REQUEST, "Group creator cannot be made a member");
  }

  // owner can change a admin to member
  if (group.creator.toString() !== adminId && role === "member") {
    throw new AppError(httpStatus.BAD_REQUEST, "Only group creator can change admin to member");
  }



  // Update the user's role in the group
  group.members = group.members.map((member) => {
    if (member._id.toString() === userId) {
      member.role = role;
    }
    return member;
  });

  // Save the updated group
  const result = await group.save();
  return result;
}

const deleteGroupFromDB = async (id: string, requester: any) => {
  // Fetch the existing group to get its creator
  const existingGroup = await Group.findById(id);
  if (!existingGroup) {
    throw new AppError(httpStatus.NOT_FOUND, "Group Not Found");
  }

  // check whether the creator is admin or not
  const isCreatorAdmin = existingGroup.members.find(
    (member) => member?._id?.toString() === requester._id
  )?.role === "admin";

  // If the creator is not an admin, return an error
  if (!isCreatorAdmin) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only Admin can delete the group"
    );
  }

  // Delete the group from the database
  const result = await Group.findByIdAndDelete(id);
  return result;
}

const updateReadMessage = async (groupId: string, userId: string, messageId: string) => {
  // Fetch the group by ID
  const group = await Group.findById(groupId);
  if (!group) {
    throw new AppError(httpStatus.NOT_FOUND, "Group Not Found");
  }

  // Fetch the user by ID
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User Not Found");
  }

  // Check if the user is a member of the group
  const isMember = group.members.find(
    (member) => member._id.toString() === userId
  );
  if (!isMember) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not a member");
  }

  // Update the user's last read message in the group
  group.members = group.members.map((member) => {
    if (member._id.toString() === userId) {
      member.lastMessageReadId = new mongoose.Types.ObjectId(messageId);
    }
    return member;
  });

  // Save the updated group
  const result = await group.save();
  return result;
}

export const GroupServices = {
  getAllGroupFromDB,
  getSingleGroupFromDB,
  updateTaskIntoGroup,
  createGroupIntoDB,
  addGroupMember,
  removeGroupMember,
  getGroupsByUserId,
  updateUserPermission,
  deleteGroupFromDB,
  updateReadMessage,
};
