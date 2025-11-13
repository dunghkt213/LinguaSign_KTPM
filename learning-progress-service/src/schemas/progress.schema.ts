import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Progress extends Document {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  courseId: string;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  progress: number; // 0-100

  @Prop({ default: null })
  lastViewedAt?: Date;

  @Prop({ default: false })
  completed?: boolean;
}

export const ProgressSchema = SchemaFactory.createForClass(Progress);