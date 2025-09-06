import { addToVectorQueue } from "./index.js";
import express from "express"
const app = express();
app.use(express.json());

app.post("/api/queue" , async(req,res) =>{
  try {
    const {metadata} = req.body;
    await addToVectorQueue(metadata);
    res.json({
      success : true,
      message: "Job added to queue"});
    } catch (err){
      res.status(500).json({success : false});
    }
});

app.listen(3000, ()=>
console.log("Queue API running at http://localhost:3000")
);