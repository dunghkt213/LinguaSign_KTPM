import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Token extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ required: true })
  expiresAt: Date; // thời điểm hết hạn (ví dụ +30 ngày)

  @Prop({ default: false })
  revoked: boolean; // true = đã thu hồi, không được dùng nữa
}

export const TokenSchema = SchemaFactory.createForClass(Token);
