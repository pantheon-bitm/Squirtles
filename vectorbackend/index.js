import { Worker, Queue } from "bullmq";
import { connectRedis } from "./connectRedis.js";
import { uploadToVectorDB } from "./quad.service.js";
import { connectVectorDB, initializeCollection } from "./connectVectorDB.js";
import IORedis from "ioredis";
import { connectDB } from "./connectDB.js";
import express from "express";
import dotenv from "dotenv" ;
dotenv.config()


// Initialize connections
connectDB(); //commented for testing
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
await initializeCollection().catch(console.error);

// Create queue instance
const vectorQueue = new Queue("vector-queue", { connection });



// fxn to add embeddings + metadata to queue

export async function addToVectorQueue(metadata){
  await vectorQueue.add("store-embedding", {metadata});
  console.log("Added to queue :", metadata.id);
}

//worker to consume jobs and upload to Qdrant

const vectorWorker = new Worker(
  "vector-queue",
  async(job) => {
    try{
      console.log(`Processing job ${job.id}`);
      const { metadata } = job.data;
      //generate embeddings 

      const { uploadToVectorDB } = await import("./quad.service.js");
      await uploadToVectorDB(metadata);

      console.log(`Job ${job.id} stored in Qdrant`);
    } catch(err){
      console.log(`Job ${job.id} failed`);
      throw err;
    }
  },
  { connection }
);

// Workers event listeners

vectorWorker.on("completed",(job)=>{
  console.log(`Job ${job.id} completed`);
})

vectorWorker.on("failed",(job,err)=>{
  console.log(`Job ${job?.id} failed`);
});

//Express Server 



export { vectorQueue , vectorWorker }
