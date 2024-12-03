import mongoose, { FilterQuery, Query, Aggregate } from "mongoose";

class QueryBuilder<T> {
  public modelQuery: Query<T[], T> | Aggregate<T[]>;
  public query: Record<string, unknown>;

  constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
    this.modelQuery = modelQuery;
    this.query = query;
  }

  search(searchableFields: string[]) {
    const searchTerm = this?.query?.searchTerm;
    if (searchTerm) {
      if (this.modelQuery instanceof mongoose.Query) {
        this.modelQuery = this.modelQuery.find({
          $or: searchableFields.map(
            (field) =>
              ({
                [field]: { $regex: searchTerm, $options: "i" },
              }) as FilterQuery<T>
          ),
        });
      }
    }

    return this;
  }

  filter() {
    const queryObj = { ...this.query }; // copy

    // Filtering
    const excludeFields = ["searchTerm", "sort", "limit", "page", "fields"];
    excludeFields.forEach((el) => delete queryObj[el]);

    if (this.modelQuery instanceof mongoose.Query) {
      this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);
    }
    return this;
  }

  sort() {
    const sort =
      (this?.query?.sort as string)?.split(",")?.join(" ") || "-createdAt";
    this.modelQuery = this.modelQuery.sort(sort as string);
    return this;
  }

  paginate() {
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const skip = (page - 1) * limit;

    this.modelQuery = this.modelQuery.skip(skip).limit(limit);
    return this;
  }

  fields() {
    const fields =
      (this?.query?.fields as string)?.split(",")?.join(" ") || "-__v";

    if (this.modelQuery instanceof mongoose.Query) {
      this.modelQuery = this.modelQuery.select(fields);
    }
    return this;
  }

  unread(readerId: string | null, assignedTo: string | null) {
    if (!readerId || !mongoose.Types.ObjectId.isValid(readerId)) {
      console.error("Invalid or missing readerId");
      return this; // Allow chaining even if invalid
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
      ].filter(Boolean),
    };
    if (this.modelQuery instanceof mongoose.Aggregate) {
      this.modelQuery.pipeline().push(...[
        { $match: matchConditions },
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
        { $match: { unreadDetails: { $ne: [] } } },
        {
          $project: {
            _id: 1,
            taskName: 1,
            author: 1,
            lastSeen: 1,
            assigned: 1,
            company: 1,
            status: 1,
            isDeleted: 1,
            important: 1,
            lastMessageId: 1,
            createdAt: 1,
            updatedAt: 1,
            dueDate: 1,
            unreadDetails: 1,
          },
        },
      ]);
    }

    console.log(this)

    return this;
  }

  async countTotal() {
    const totalQueries = this.modelQuery instanceof mongoose.Query ? this.modelQuery.getFilter() : {};
    const total = await (this.modelQuery.model as mongoose.Model<T>).countDocuments(totalQueries);
    const page = Number(this?.query?.page) || 1;
    const limit = Number(this?.query?.limit) || 10;
    const totalPage = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPage,
    };
  }
}

export default QueryBuilder;
