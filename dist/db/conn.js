"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = exports.mongoClient = void 0;
// Connect to mongodb
const mongodb_1 = require("mongodb");
exports.mongoClient = new mongodb_1.MongoClient(process.env.DATABASE_URL);
async function connectDatabase() {
    await exports.mongoClient.connect();
}
exports.connectDatabase = connectDatabase;
