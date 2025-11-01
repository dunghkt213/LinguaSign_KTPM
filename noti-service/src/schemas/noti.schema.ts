import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Noti extends Document {
    @Prop({ required: true})
    userId: string;

    @Prop({ required: true })
    message: string;

    @Prop({ required: true})
    title: string;

    @Prop({ default: false })
    read: boolean;
}

export const NotiSchema = SchemaFactory.createForClass(Noti);