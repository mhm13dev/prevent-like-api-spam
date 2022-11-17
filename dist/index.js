"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const dotenv_1 = __importDefault(require("dotenv"));
const invariant_1 = __importDefault(require("invariant"));
dotenv_1.default.config();
const conn_1 = require("./db/conn");
const catch_async_1 = require("./utils/catch.async");
const app_error_1 = require("./utils/app.error");
const app = (0, express_1.default)();
app.use(express_1.default.json());
const collections = {
    posts: "posts",
    posts_likes: "posts_likes",
};
app.post("/posts", (0, catch_async_1.catchAsync)(async (req, res, next) => {
    const { title } = req.body;
    try {
        (0, invariant_1.default)(title?.trim(), "Title is required");
    }
    catch (err) {
        return next(new app_error_1.AppError(err.message, 400));
    }
    const post = {
        _id: new mongodb_1.ObjectId(),
        title: title.trim(),
    };
    const postLike = {
        _id: new mongodb_1.ObjectId(),
        post_id: post._id,
        likes_count: 0,
        users: [],
    };
    await conn_1.mongoClient.db().collection(collections.posts).insertOne(post);
    conn_1.mongoClient.db().collection(collections.posts_likes).insertOne(postLike);
    res.status(201).json({
        status: "success",
        message: "Post created successfully",
        data: post,
    });
}));
app.patch("/posts/:_id/like", (0, catch_async_1.catchAsync)(async (req, res, next) => {
    const { _id } = req.params;
    const { user_id, action } = req.body;
    try {
        (0, invariant_1.default)(_id?.trim(), "_id is required");
        (0, invariant_1.default)(user_id?.toString()?.trim(), "user_id is required");
        (0, invariant_1.default)(action === "like" || action === "unlike", "Invalid action. Action must be either like or unlike");
    }
    catch (err) {
        return next(new app_error_1.AppError(err.message, 400));
    }
    let postId;
    let userId;
    try {
        postId = new mongodb_1.ObjectId(_id);
        userId = new mongodb_1.ObjectId(user_id?.toString());
    }
    catch (err) {
        return next(new app_error_1.AppError("Invalid Object ID", 400));
    }
    const timestamp = new Date();
    if (action === "like") {
        await conn_1.mongoClient
            .db()
            .collection(collections.posts_likes)
            .updateOne({
            post_id: postId,
            users: {
                $not: {
                    $elemMatch: {
                        user_id: userId,
                    },
                },
            },
        }, {
            $inc: {
                likes_count: 1,
            },
            $push: {
                users: {
                    user_id: userId,
                    timestamp,
                },
            },
        });
    }
    else {
        await conn_1.mongoClient
            .db()
            .collection(collections.posts_likes)
            .updateOne({
            post_id: postId,
            users: {
                $elemMatch: {
                    user_id: userId,
                },
            },
        }, {
            $inc: {
                likes_count: -1,
            },
            $pull: {
                users: {
                    user_id: userId,
                },
            },
        });
    }
    res.status(200).json({
        status: "success",
        message: action === "like" ? "Post liked" : "Post unliked",
    });
}));
// Catch all route
app.all("*", (req, res, next) => {
    next(new app_error_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Global error handler
app.use((err, _req, res) => {
    const { statusCode, isAppError } = err;
    res.status(statusCode ?? 500).json({
        status: isAppError ? err.status : "error",
        message: isAppError ? err.message : "Something went wrong",
    });
});
(0, conn_1.connectDatabase)()
    .then(() => {
    console.log("Connected to database");
    const port = process.env.PORT;
    app.listen(port, () => {
        console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
    });
})
    .catch((err) => {
    console.log(err);
    process.exit(1);
});
