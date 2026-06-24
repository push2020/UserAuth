import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      minlength: [2, "Name must have atleast 2 characters"],
    },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: {
      type: String,
      unique: true,
      validate: {
        validator: (v) => {
          return /^[6-9]\d{9}$/.test(v); // Indian phone number pattern
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    address: { type: String },
    // Avatar: either Cloudinary URL (string) or legacy { data: Buffer, contentType: String }
    avatar: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("users", UserSchema);

export default UserModel;
