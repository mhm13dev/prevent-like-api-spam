import express, { Express, NextFunction, Request, Response } from "express";
import { ObjectId, WithId } from "mongodb";
import dotenv from "dotenv";
import invariant from "invariant";

dotenv.config();

import { mongoClient, connectDatabase } from "./db/conn";
import { catchAsync } from "./utils/catch.async";
import { AppError } from "./utils/app.error";

const app: Express = express();

app.use(express.json());

const collections = {
  posts: "posts",
  posts_likes: "posts_likes",
};

interface Post {
  title: string;
}

interface PostLike {
  post_id: ObjectId;
  likes_count: number;
  users: { user_id: ObjectId; timestamp: Date }[];
}

app.post(
  "/posts",
  catchAsync(async (req, res, next) => {
    const { title } = req.body as { title?: string };

    try {
      invariant(title?.trim(), "Title is required");
    } catch (err: any) {
      return next(new AppError(err.message, 400));
    }

    const post: WithId<Post> = {
      _id: new ObjectId(),
      title: title!.trim(),
    };

    const postLike: WithId<PostLike> = {
      _id: new ObjectId(),
      post_id: post._id,
      likes_count: 0,
      users: [],
    };

    await mongoClient.db().collection(collections.posts).insertOne(post);
    mongoClient.db().collection(collections.posts_likes).insertOne(postLike);

    res.status(201).json({
      status: "success",
      message: "Post created successfully",
      data: post,
    });
  })
);

app.patch(
  "/posts/:_id/like",
  catchAsync(async (req, res, next) => {
    const { _id } = req.params as { _id?: string };
    const { user_id, action } = req.body as {
      user_id?: string;
      action?: "like" | "unlike";
    };

    try {
      invariant(_id?.trim(), "_id is required");
      invariant(user_id?.toString()?.trim(), "user_id is required");
      invariant(
        action === "like" || action === "unlike",
        "Invalid action. Action must be either like or unlike"
      );
    } catch (err: any) {
      return next(new AppError(err.message, 400));
    }

    let postId: ObjectId;
    let userId: ObjectId;
    try {
      postId = new ObjectId(_id);
      userId = new ObjectId(user_id?.toString());
    } catch (err: any) {
      return next(new AppError("Invalid Object ID", 400));
    }

    const timestamp = new Date();

    if (action === "like") {
      await mongoClient
        .db()
        .collection<PostLike>(collections.posts_likes)
        .updateOne(
          {
            post_id: postId,
            users: {
              $not: {
                $elemMatch: {
                  user_id: userId,
                },
              },
            },
          },
          {
            $inc: {
              likes_count: 1,
            },
            $push: {
              users: {
                user_id: userId,
                timestamp,
              },
            },
          }
        );
    } else {
      await mongoClient
        .db()
        .collection<PostLike>(collections.posts_likes)
        .updateOne(
          {
            post_id: postId,
            users: {
              $elemMatch: {
                user_id: userId,
              },
            },
          },
          {
            $inc: {
              likes_count: -1,
            },
            $pull: {
              users: {
                user_id: userId,
              },
            },
          }
        );
    }

    res.status(200).json({
      status: "success",
      message: action === "like" ? "Post liked" : "Post unliked",
    });
  })
);

// Catch all route
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use((err: AppError, _req: Request, res: Response) => {
  const { statusCode, isAppError } = err;

  res.status(statusCode ?? 500).json({
    status: isAppError ? err.status : "error",
    message: isAppError ? err.message : "Something went wrong",
  });
});

connectDatabase()
  .then(() => {
    console.log("Connected to database");

    const port = process.env.PORT;

    app.listen(port, () => {
      console.log(
        `⚡️[server]: Server is running at https://localhost:${port}`
      );
    });
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
