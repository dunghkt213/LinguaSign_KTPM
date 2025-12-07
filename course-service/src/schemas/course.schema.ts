import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Course extends Document {
  @Prop({ required: true, index: true })
  title: string;

  @Prop()
  duration?: string;

  @Prop()
  thumbnail?: string;

  @Prop()
  video?: string;

  @Prop()
  description?: string;
}

export const CourseSchema = SchemaFactory.createForClass(Course);