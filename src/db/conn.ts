// Connect to mongodb
import { MongoClient } from "mongodb";

export const mongoClient = new MongoClient(process.env.DATABASE_URL!);

export async function connectDatabase() {
  await mongoClient.connect();
}
