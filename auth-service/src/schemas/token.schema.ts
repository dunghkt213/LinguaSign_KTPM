import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Token extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, unique: true, index: true })
  refreshToken: string;

  @Prop({ default: false })
  revoked: boolean;

  @Prop()
  expiresAt: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
