import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop()
  name: string;

  @Prop()
  age?: number;

  @Prop()
  bio?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
