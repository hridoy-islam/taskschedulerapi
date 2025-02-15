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

//     // Build query to search notes where userId is present in 'sharedWith' array
//     const noteQuery = new QueryBuilder(
//       Note.find({ sharedWith: { $in: [userIdObj] } }),
//       query
//     )
//       .search(NoteSearchableFields)  // Apply search logic based on NoteSearchableFields
//       .filter()                     // Apply filter conditions
//       .sort()                        // Apply sorting
//       .paginate()                    // Apply pagination
//       .fields();                     // Select specific fields if needed

//     // Count total documents based on the query
//     const meta = await Note.countDocuments({ sharedWith: { $in: [userIdObj] } });

//     // Execute the query to get the actual results
//     const result = await noteQuery.modelQuery.exec();

//     if (!result.length) {
//       return { meta: 0, result: [] };
//     }

//     // Step 1: Fetch all users who have the note shared with them
//     const sharedWithUsers = await User.find({ _id: { $in: result[0]?.sharedWith } });

//     // Step 2: Track notified users across all notes
//     const notifiedUserIds = new Set();

//     // Step 3: Get the author of the note
//     const author = await User.findById(result[0]?.authorID); // Assuming notes have an authorId field

//     if (author) {
//       // Step 4: Loop through each user in 'sharedWith' and send notifications
//       for (const assigned of sharedWithUsers) {
//         const assignedId = assigned._id.toString(); // Convert ObjectId to string

//         // Debug: Log user notification status
//         console.log(`Checking notification for user: ${assigned}`);

//         // Step 5: Check if the user has already been notified
//         if (notifiedUserIds.has(assignedId)) {
//           console.log(`User ${assignedId} already notified, skipping.`);
//           continue; // Skip if already notified
//         }

//         // Step 6: Create the notification
//         const notification = await NotificationService.createNotificationIntoDB({
//           userId: assigned._id, // User receiving the notification
//           senderId: author._id, // User creating the task
//           type: "note",
//           message: `${author.name} shared a new note with you titled "${result[0]?.title}"`,
//         });

//         // Debug: Log notification creation
//         console.log(`Created notification for user: ${assignedId}`, notification);

//         // Step 7: Send the notification in real-time using WebSocket
//         const io = getIO();
//         io.to(assignedId).emit("notification", notification);

//         // Debug: Log WebSocket notification
//         console.log(`Sent real-time notification to user: ${assignedId}`);

//         // Step 8: Mark this user as notified
//         notifiedUserIds.add(assignedId);
//       }
//     }

//     // Step 9: Return the fetched notes and meta data
//     return {
//       meta,  // Total number of notes shared with the user
//       result, // Fetched notes with author and tags populated
//     };
//   } catch (error) {
//     console.error('Error fetching shared notes by user:', error);
//     return {
//       meta: 0,
//       result: [],  // Return an empty result in case of error
//     };
//   }
// };






const updateNoteIntoDB = async (id: string, payload: Partial<TNote>) => {
  try{
    const result = await Note.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
      upsert: true,
    });
    
    return result;
  }
  catch(error){
    console.error('Error updating note:', error);
    throw new Error('Failed to update note');
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
