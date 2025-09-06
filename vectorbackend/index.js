import { Worker, Queue } from "bullmq";
import { connectRedis } from "./connectRedis.js";
import { uploadToVectorDB } from "./quad.service.js";
import { connectVectorDB, initializeCollection } from "./connectVectorDB.js";
import IORedis from "ioredis";
import { connectDB } from "./connectDB.js";


// Initialize connections
connectDB();
connectRedis();

const connection = new IORedis(
  {
    host: process.env.REDIS_URI,
    port: process.env.REDIS_PORT,
    username: process.env.REDIS_UNAME,
    password: process.env.REDIS_PASSWORD,
  },
  {
    maxRetriesPerRequest: null,
  }
);

// Initialize collection on startup
await connectVectorDB();
initializeCollection().catch(console.error);

// Create queue instance
const vectorQueue = new Queue("vector-queue", { connection });
