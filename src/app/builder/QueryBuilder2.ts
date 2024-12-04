import mongoose from "mongoose";

export async function GetList(
  messageModel: any,
  queryParams: any,
  readerId: string | null,
  assignedTo: string | null
) {
  // Validate `readerId` and `assignedTo` as ObjectIds
  const { page = 1, limit = 10, searchTerm, sort } = queryParams;

  if (!readerId || !mongoose.Types.ObjectId.isValid(readerId)) {
    console.error("Invalid or missing readerId");
    return [];
  }
  const userObjectId = new mongoose.Types.ObjectId(readerId);

  const taskObjectId =
    assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)
      ? new mongoose.Types.ObjectId(assignedTo)
      : null;

  // Define the query conditions
  const matchConditions = {
    $or: [
      { author: userObjectId, assigned: taskObjectId },
      { assigned: userObjectId, author: taskObjectId },
    ].filter(Boolean), // Ensure no null values in the `$or` array
  };

  // Determine the sort criteria
  const sortField = sort && sort.startsWith("-") ? sort.substring(1) : sort;
  const sortOrder = sort && sort.startsWith("-") ? -1 : 1;

  // Calculate skip and limit for pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Aggregation pipeline
  const tasks = await messageModel
    .aggregate([
      // Match the tasks based on author and assigned conditions
      { $match: matchConditions },

      // Add a field for `unread` status by filtering the `lastSeen` array
      {
        $addFields: {
          unreadDetails: {
            $filter: {
              input: "$lastSeen",
              as: "seen",
              cond: {
                $and: [
                  { $eq: ["$$seen.userId", userObjectId] },
                  { $ne: ["$$seen.lastSeenId", "$lastMessageId"] },
                ],
              },
            },
          },
        },
      },

      // Match tasks that have unread messages
      { $match: { unreadDetails: { $ne: [] } } },

      // Re-group by task `_id` to reconstruct the original structure
      {
        $project: {
          _id: 1,
          taskName: 1,
          author: 1,
          lastSeen: 1, // Include the entire original `lastSeen` array
          assigned: 1,
          company: 1,
          status: 1,
          isDeleted: 1,
          important: 1,
          lastMessageId: 1,
          createdAt: 1,
          updatedAt: 1,
          dueDate: 1,
          unreadDetails: 1, // Include filtered `unreadDetails` array for context if needed
        },
      },

      // Populate author, assigned, and company fields
      {
        $lookup: {
          from: "users",
          localField: "author",
          foreignField: "_id",
          as: "author",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assigned",
          foreignField: "_id",
          as: "assigned",
        },
      },
      {
        $lookup: {
          from: "companies",
          localField: "company",
          foreignField: "_id",
          as: "company",
        },
      },

      {
        $addFields: {
          author: { $arrayElemAt: ["$author", 0] },
          assigned: { $arrayElemAt: ["$assigned", 0] },
          company: { $arrayElemAt: ["$company", 0] },
        },
      },

      // Apply sorting
      { $sort: { [sortField || "createdAt"]: sortOrder } },

      // Apply pagination
      { $skip: skip },
      { $limit: Number(limit) },
    ])
    .exec();

  return tasks;
}
