import mongoose from 'mongoose';

const options = {
  discriminatorKey: 'role',
  timestamps: true,
};

const userSchema = new mongoose.Schema({
  //Basic User Information
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    middleName: {type: String, default: ""},
    email: { type: String,required: true, }, 
    password:{ type: String,required: true },
    phoneNumber: String, 
    role: { type: String, default: 'user' },
      AccountStatus:{
        type:String,
        enum: ["Verified" , "Not Verified"],
        select: false,
        default: "Not Verified"
    },  

    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: Number,
      select: false,
    },

    verificationCodeValidation: {
      type: Number,
      select: false,
    },
    codeExpiration: {
      type: Date,
      select: false,
    },

    forgotPasswordCode: {
      type: Number,
      select: false,
    },
    
  }, options
 );

export default mongoose.model("User", userSchema);



     