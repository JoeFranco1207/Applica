import mongoose from 'mongoose';


export const connectDB = async () =>{

    try{ 

        await mongoose.connect(process.env.MONGO_URI);
        console.log("database connected successfully");
        

         
    }catch(err){
         console.log(`failed to connect${err}`);
    }
};

export default connectDB;