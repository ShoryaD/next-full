import mongoose, { Schema, Document } from 'mongoose';

export interface Message extends Document {
    content: String,
    createdAt: Date,
}

const MessageSchema: Schema<Message> = new Schema({
    content: {
        type: String,
        required: true
    },
    createdAt : {
        type: Date,
        required : true,
        default: Date.now
    }
})

export interface User extends Document {
    username: string,
    email: string,
    password: string,
    verifyCode: string,
    verifyCodeExpiry: Date,
    isVerified: boolean,
    isAcceptingMessages: boolean,
    messages : Message[]
}

const UserSchema: Schema<User> = new Schema({
    username: {
        type: String,
        required: [true, 'Username is Required'],
        trim: true,
        unique: true
    },
    email: {
        type: String,
        required: [true, 'Email is Required'],
        unique: true,
        match: [/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/, 'Please use a Valid E-Mail address']
    },
    password: {
        type: String,
        required: [true, 'Password is Required'],
    },
    verifyCode: {
        type: String,
        required: [true, 'Verify Code is Required'],
    },
    verifyCodeExpiry: {
        type: Date,
        required: [true, 'Verify Code Expiry is Required'],
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isAcceptingMessages: {
        type: Boolean,
        default: true
    },
    messages: [MessageSchema]
})

const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model("User", UserSchema);

export default UserModel;