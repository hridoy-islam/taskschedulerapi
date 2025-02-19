import QueryBuilder from "../../builder/QueryBuilder";
import { Note } from "./note.model";
import { TNote } from "./note.interface";
import { NoteSearchableFields } from "./note.constant";
import { User } from "../user/user.model";
import mongoose, { Types } from "mongoose";
import { query } from "express";
import { getIO } from "../../../socket";
import { NotificationService } from "../notification/notification.service";

const { ObjectId } = mongoose.Types;

const createNoteIntoDB = async (payload:TNote) => {
  try {
    const { title, author, content, tags } = payload;

    // Validate required fields
    if (!title || !author) {
      console.error("Validation Failed: Missing title or assignId", { title, author });
      return { success: false, message: "Title and assignId are required." };
    }

    // Find user by ID
    const user = await User.findById(author);
    if (!user) {
      return { success: false, message: "Assigned user not found." };
    }

    // Create the note payload
    const notePayload = {
      title,
      author,
      content: content || "", 
      tags: tags || [],  
    };

    const data = await Note.create(notePayload);

    return {
      success: true,
      message: "Note created successfully.",
      data: {
        ...data.toObject(),
        authorName: user.name, 
        noteTitle: data.title, 
      },
    };
  } catch (error) {
    console.error("Error creating note:", error);
    return { success: false, message: "Internal server error." };
  }
};





const getAllNoteFromDB = async (query: Record<string, unknown>) => {
  const noteQuery = new QueryBuilder(Note.find().populate("author").populate("tags"), query)
    .search(NoteSearchableFields)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await noteQuery.countTotal();
  const result = await noteQuery.modelQuery;

  return {
    meta,
    result,
  };
};





const getNoteByUserIdFromDB = async (authorId: string, query: Record<string, unknown>) => {
  try {
    // Build query to search notes by author ID and populate 'author' and 'tags'
    const noteQuery = new QueryBuilder(Note.find({ author: authorId }).populate("author").populate("tags"),query)
      .search(NoteSearchableFields)  // Apply search logic based on NoteSearchableFields
      .filter()                     // Apply filter conditions
      .sort()                        // Apply sorting
      .paginate()                    // Apply pagination
      .fields();                     // Select specific fields if needed

    // Count total documents based on the query
    const meta = await Note.countDocuments({ author: authorId });  // Get total count of notes for the author

    // Execute the query to get the actual results
    const result = await noteQuery.modelQuery.exec(); // Execute query and return the result

    return {
      meta,  // Total number of notes for the author
      result, // Fetched notes with author and tags populated
    };
  } catch (error) {
    console.error("Error fetching notes by author:", error);
    return {
      meta: 0,
      result: [],  // Return empty result in case of error
    };
  }
};


const getNoteByIdFromDB= async (noteId: string, query: Record<string, unknown>) => {
  try {
    const noteQuery = new QueryBuilder(Note.find({ _id:noteId }).populate("author").populate("tags"),query)
      .search(NoteSearchableFields)  // Apply search logic based on NoteSearchableFields
      .filter()                     // Apply filter conditions
      .sort()                        // Apply sorting
      .paginate()                    // Apply pagination
      .fields();                     // Select specific fields if needed

    // Count total documents based on the query

    // Execute the query to get the actual results
    const result = await noteQuery.modelQuery.exec(); // Execute query and return the result

    return {
      result, // Fetched notes with author and tags populated
    };
  } catch (error) {
    console.error("Error fetching notes by author:", error);
    return {
      meta: 0,
      result: [],  // Return empty result in case of error
    };
  }
}

const getSharedNoteByIdFromDB = async (userId: string, query: Record<string, unknown>) => {
  try {
    const userIdObj = new ObjectId(userId); 

    // Build query to search notes where userId is present in 'sharedWith' array
    const noteQuery = new QueryBuilder(
      Note.find({ sharedWith: { $in: [userIdObj] } })  , 
      query
    )
      .search(NoteSearchableFields)  // Apply search logic based on NoteSearchableFields
      .filter()                     // Apply filter conditions
      .sort()                        // Apply sorting
      .paginate()                    // Apply pagination
      .fields();                     // Select specific fields if needed

    // Count total documents based on the query
    const meta = await Note.countDocuments({ sharedWith: { $in: [userIdObj] } });  // Use userIdObj

    // Execute the query to get the actual results
    const result = await noteQuery.modelQuery.exec(); // Execute the query

    return {
      meta,  // Total number of notes shared with the user
      result, // Fetched notes with author and tags populated
    };
  } catch (error) {
    console.error('Error fetching shared notes by user:', error);
    return {
      meta: 0,
      result: [],  // Return an empty result in case of error
    };
  }
};


// const getSharedNoteByIdFromDB = async (userId: string, query: Record<string, unknown>) => {
//   try {
//     const userIdObj = new ObjectId(userId);

//     const noteQuery = new QueryBuilder(
//       Note.find({ sharedWith: { $in: [userIdObj] } }),
//       query
//     )
//       .search(NoteSearchableFields)
//       .filter()
//       .sort()
//       .paginate()
//       .fields();

//     const meta = await Note.countDocuments({ sharedWith: { $in: [userIdObj] } });

//     const result = await noteQuery.modelQuery.exec();

//     if (!result.length) {
//       return { meta: 0, result: [] };
//     }

//     const sharedWithUsers = await User.find({ _id: { $in: result.flatMap(note => note.sharedWith) } });

//     for (const note of result) {
//       const author = await User.findById(note.author);
//       if (!author) continue;

//       for (const assigned of sharedWithUsers) {
//         const assignedId = assigned._id.toString();

//         // **Step 1: Check if notification already exists**
//         const existingNotification = await NotificationService.findNotification({
//           userId: assigned._id,
//           senderId: author._id,
//           type: "note",
//           message: `${author.name} shared a new note with you titled "${note.title}"`,
//         });

//         if (existingNotification) {
//           console.log(`Skipping duplicate notification for user ${assignedId} on note ${note._id}`);
//           continue; // Skip sending if it already exists
//         }

//         // **Step 2: Create and send notification**
//         const notification = await NotificationService.createNotificationIntoDB({
//           userId: assigned._id,
//           senderId: author._id,
//           type: "note",
//           message: `${author.name} shared a new note with you titled "${note.title}"`,
//         });
//         console.log(`Created Notification:`, notification);
//         const io = getIO();
//         io.to(assignedId).emit("notification", notification);

//         console.log(`Notification sent to user ${assignedId} for note ${note._id}`);
//       }
//     }

//     return { meta, result };
//   } catch (error) {
//     console.error("Error fetching shared notes by user:", error);
//     return { meta: 0, result: [] };
//   }
// };






// const updateNoteIntoDB = async (id: string, payload: Partial<TNote>) => {
//   try{
//     const result = await Note.findByIdAndUpdate(id, payload, {
//       new: true,
//       runValidators: true,
//       upsert: true,
//     });
    
//     return result;
//   }
//   catch(error){
//     console.error('Error updating note:', error);
//     throw new Error('Failed to update note');
//   }
  
// };


const updateNoteIntoDB = async (noteId: string, payload: Partial<TNote>) => {
  try {
    // Fetch the note first
    console.log(`Fetching note with ID: ${noteId}`);
    const note = await Note.findById(noteId);
    if (!note) throw new Error("Note not found");

    // Fetch the author using note.author
    console.log(`Fetching author with ID: ${note.author}`);
    const author = await User.findById(note.author);
    if (!author) throw new Error("Author not found");

    // Update the note
    console.log(`Updating note with ID: ${noteId}`);
    const result = await Note.findByIdAndUpdate(noteId, payload, {
      new: true,
      runValidators: true,
      upsert: true,
    });

    if (!result) throw new Error("Note update failed");
    console.log(`Note updated successfully: ${result.title}`);

    // Check shared users and send notifications
    if (result.sharedWith && result.sharedWith.length > 0) {
      console.log(`Shared with users: ${result.sharedWith}`);

      // Get all users in the sharedWith array
      const assignedUsers = await User.find({
        _id: { $in: result.sharedWith },
      });
      console.log(`Found ${assignedUsers.length} shared users`);

      const notificationsToCreate = [];

      // Loop through assigned users and create notifications
      for (const assigned of assignedUsers) {
        if (!assigned) {
          console.log("User not found, skipping.");
          continue; // Skip if user not found
        }

        const notification = await NotificationService.createNotificationIntoDB({
          userId: assigned._id,
          senderId: author._id,
          type: "note",
          message: `${author.name} shared a note: "${result.title}"`,
        });

        if (notification) {
          notificationsToCreate.push(notification);
        } else {
          console.log(`Failed to create notification for user: ${assigned._id}`);
        }
      }

      // Log the number of notifications created
      console.log(`Created ${notificationsToCreate.length} notifications`);
      
      if (notificationsToCreate.length > 0) {
        // Send notifications in real-time using WebSocket
        const io = getIO();
        notificationsToCreate.forEach((notification) => {
          if (notification) {
            console.log(`Sending notification to user: ${notification.userId}`);
            io.to(notification.userId.toString()).emit("notification", notification);
          }
        });
      } else {
        console.log("No new notifications to send.");
      }
    } else {
      console.log("No users to notify for this note.");
    }

    return result;
  } catch (error) {
    console.error("Error updating note:", error);
    throw new Error("Failed to update note");
  }
};





const deleteNoteFromDB = async (id: string) => {
  try {
    // Find and delete the note by matching the _id field
    const result = await Note.findOneAndDelete({ _id: id });

    if (!result) {
      throw new Error("Note not found");
    }

    return result;
  } catch (error) {
    console.error("Error deleting note:", error);
    return null;  // Return null in case of an error or if the note isn't found
  }
};



export const NoteServices = {
  getAllNoteFromDB,
  getNoteByUserIdFromDB,
  updateNoteIntoDB,
  createNoteIntoDB,
  deleteNoteFromDB,
  getNoteByIdFromDB,
  getSharedNoteByIdFromDB
};
