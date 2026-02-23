import { Server } from "http";
import { Server as SocketServer } from "socket.io";

let io: SocketServer | null = null;

export const initializeSocket = (server: Server): void => {
  io = new SocketServer(server, {
    pingTimeout: 60000,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("Connected to socket.io");

    socket.on("setup", (userData: any) => {
      socket.join(userData._id);
      // console.log(userData._id);
      socket.emit("connected");
    });
    socket.on("join chat", (room: any) => {
      socket.join(room);
      // console.log("user joined room " + room);
    });
    socket.on("typing", (typer: any) => {
      const { room, user } = typer;
      socket.broadcast.to(room).emit("typing", typer);
    });
    socket.on("stop typing", (typer: any) => {
      const { room, user } = typer;
      socket.broadcast.to(room).emit("stop typing", typer);
    });

   socket.on("new message", (newMessageReceived: any) => {
  // FIX: Access the comment object at the correct depth
  let chat = newMessageReceived?.data; 
  
  if (!chat || !chat.authorId) {
    return console.log("chat.authorId not defined, message dropped");
  }

  // FIX: Emit directly to the group/task room so everyone in it gets the message
  if (chat.taskId) {
    socket.to(chat.taskId.toString()).emit("message received", newMessageReceived);
  }

  // Optional: Keep your existing logic to notify offline/other users
  if (chat.otherUserArr) {
    chat.otherUserArr.forEach((user: any) => {
      // Skip the sender
      if (user._id !== chat.authorId) {
        socket.in(user._id).emit("message received", newMessageReceived);
      }
    });
  }
});

    // Handle new comment events
    socket.on("newComment", (commentData: any) => {
      const { taskId, authorId, otherUser } = commentData;

      // Ensure `io` is initialized before emitting
      if (!io) {
        console.error("Socket.io is not initialized!");
        return;
      }

      // Emit the new comment to the specific task's room
      if (taskId) {
        io.to(taskId.toString()).emit("newComment", commentData);
        console.log(`New comment emitted to task room: ${taskId}`);
      }

      // Notify the assigned user (otherUser) if they are not the author
      if (otherUser && otherUser !== authorId) {
        io.to(otherUser.toString()).emit("newComment", commentData);
        console.log(`New comment emitted to assigned user: ${otherUser}`);
      }
    });

    // Add other socket event handlers as needed
    socket.on("send notification", (notificationData: any) => {
      if (notificationData.userId) {
        socket
          .to(notificationData.userId)
          .emit("notification", notificationData);
        console.log(`Notification sent to user ${notificationData.userId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });

    socket.off("setup", (userData: any) => {
      socket.leave(userData._id);
    });
  });
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};
