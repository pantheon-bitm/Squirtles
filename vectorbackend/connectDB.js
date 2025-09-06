import mongoose from "mongoose";
export let Image;
export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
<<<<<<< HEAD
      `${process.env.MONGODB_URI}/users`
=======
      `${process.env.MONGODB_URI}/subdomains`
>>>>>>> fafb721 (fresh frontend)
    );
    Image = await connectionInstance.connection.db.collection("images");
    console.log(
      `\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error(error);
    console.error("MongoDB connection failed");
    process.exit(0);
  }
};
