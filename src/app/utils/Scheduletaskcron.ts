import cron from "node-cron";
import moment from "moment";
import { ScheduleTask } from "../modules/scheduleTask/scheduleTask.model";
import { Task } from "../modules/task/task.model";
import { User } from "../modules/user/user.model";
import { NotificationService } from "../modules/notification/notification.service";
import { getIO } from "../../socket";

/**
 * Runs every day at midnight (00:00)
 *
 * Logic:
 * - daily   → dueDate passed → create task, set next dueDate to tomorrow
 * - weekly  → dueDate passed → create task, set next dueDate to same weekday next week (from scheduledDate 0–6)
 * - monthly → dueDate passed → create task, set next dueDate to same day next month (from scheduledDate 1–31)
 * - once    → dueDate passed → create task (no reschedule)
 */

export const scheduleTaskCronJob = () => {
  cron.schedule("0 0 * * *", async () => {
    // console.log("[CRON] Running schedule task processor:", new Date().toISOString());

    try {
      const now = moment().startOf("day").toDate();

      // Find all recurring/once schedule tasks whose dueDate has passed and not deleted
      const dueTasks = await ScheduleTask.find({
        isDeleted: false,
        dueDate: { $lte: now },
        frequency: { $in: ["daily", "weekly", "monthly", "once"] },
      });

      console.log(`[CRON] Found ${dueTasks.length} due schedule task(s)`);

      for (const scheduleTask of dueTasks) {
        try {
          let nextDueDate: Date | null = null;

          // ── 1. Calculate the next due date FIRST ──
          if (scheduleTask.frequency === "daily") {
            nextDueDate = moment(scheduleTask.dueDate).add(1, "day").toDate();
          } else if (
            scheduleTask.frequency === "weekly" &&
            scheduleTask.scheduledDate !== undefined &&
            scheduleTask.scheduledDate !== null
          ) {
            nextDueDate = moment(scheduleTask.dueDate)
              .add(1, "week")
              .day(scheduleTask.scheduledDate)
              .startOf("day")
              .toDate();
          } else if (
            scheduleTask.frequency === "monthly" &&
            scheduleTask.scheduledDate !== undefined &&
            scheduleTask.scheduledDate !== null
          ) {
            const nextMonth = moment(scheduleTask.dueDate).add(1, "month");
            const daysInNextMonth = nextMonth.daysInMonth();
            const targetDay = Math.min(scheduleTask.scheduledDate, daysInNextMonth);
            nextDueDate = nextMonth.date(targetDay).startOf("day").toDate();
          } else if (scheduleTask.frequency === "once") {
            await ScheduleTask.findByIdAndUpdate(scheduleTask._id, {
              isDeleted: true,
            });
            console.log(`[CRON] Marked once-task as deleted: ${scheduleTask._id}`);
          }

          // ── 2. Create the real Task and assign it to a variable ──
          const newTask = await Task.create({
            taskName: scheduleTask.taskName,
            description: scheduleTask.description,
            author: scheduleTask.author,
            assigned: scheduleTask.assigned,
            company: scheduleTask.company,
            status: "pending",
            priority: scheduleTask.priority || "low",
            dueDate: nextDueDate || scheduleTask.dueDate,
            frequency: scheduleTask.frequency,
            scheduledDate: scheduleTask.scheduledDate ?? null,
            isRecurring: scheduleTask.isRecurring,
          });

          // ── 3. Notification Logic ──
          if (scheduleTask.assigned && scheduleTask.author.toString() !== scheduleTask.assigned.toString()) {
            // Fetch the author to get their name for the message
            const authorUser = await User.findById(scheduleTask.author);
            
            if (authorUser) {
              const notification = await NotificationService.createNotificationIntoDB({
                userId: scheduleTask.assigned,
                senderId: scheduleTask.author,
                type: "task",
                message: `${authorUser.name} assigned a  task "${newTask.taskName}"`,
                docId: newTask._id.toString(),
              });

              const io = getIO();
              const assignedId = scheduleTask.assigned.toString();
              io.to(assignedId).emit("notification", notification);
            }
          }

          // ── 4. Update the ScheduleTask with the new nextDueDate ──
          if (nextDueDate) {
            await ScheduleTask.findByIdAndUpdate(scheduleTask._id, {
              dueDate: nextDueDate,
            });
            console.log(
              `[CRON] Updated dueDate for task "${scheduleTask.taskName}" → ${moment(nextDueDate).format("YYYY-MM-DD")}`
            );
          }
        } catch (taskError) {
          console.error(
            `[CRON] Failed to process scheduleTask ${scheduleTask._id}:`,
            taskError
          );
        }
      }

      console.log("[CRON] Schedule task processing complete.");
    } catch (error) {
      console.error("[CRON] Fatal error in schedule task cron job:", error);
    }
  });

  console.log("[CRON] Schedule task cron job registered.");
};