import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Kafka message handlers (api-gateway will send these)
  @MessagePattern('course.create')
  async handleCreate(@Payload() data: any) {
    try {
      // data có thể chứa: { title, description, videoBuffer, videoFileName, ... }
      let video: string | null = null;
      
      // Nếu có video buffer, upload lên MinIO trước
      if (data.videoBuffer && data.videoFileName) {
        const uploadResult = await this.appService.uploadVideo(
          data.videoFileName,
          data.videoBuffer
        );
        video = uploadResult.url;
      }

      // Tạo course với video link
      const courseData = {
        ...data,
        video, // Lưu link video vào DB
      };
      delete courseData.videoBuffer; // Xóa buffer khỏi data
      delete courseData.videoFileName;

      const created = await this.appService.create(courseData);
      return { success: true, message: 'Course created', data: created };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('course.getAll')
  async handleGetAll() {
    try {
      const all = await this.appService.getAll();
      return { success: true, data: all };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('course.get')
  async handleGet(@Payload() data: { id: string }) {
    try {
      const c = await this.appService.getById(data?.id);
      return { success: true, data: c };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('course.update')
  async handleUpdate(@Payload() data: { id: string; dto: any }) {
    try {
      let video: string | undefined = data.dto.video;

      // Nếu có video mới, upload lên MinIO
      if (data.dto.videoBuffer && data.dto.videoFileName) {
        const uploadResult = await this.appService.uploadVideo(
          data.dto.videoFileName,
          data.dto.videoBuffer
        );
        video = uploadResult.url;
      }

      const updateData = {
        ...data.dto,
        video,
      };
      delete updateData.videoBuffer;
      delete updateData.videoFileName;

      const updated = await this.appService.update(data.id, updateData);
      return { success: true, data: updated };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('course.delete')
  async handleDelete(@Payload() data: { id: string }) {
    try {
      const res = await this.appService.remove(data.id);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('course.getVideoUrl')
  async handleGetVideoUrl(@Payload() data: { fileName: string }) {
    try {
      const url = await this.appService.getVideoUrl(data.fileName);
      return { success: true, data: { url } };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }

  @MessagePattern('course.getVideoMetadata')
  async handleGetVideoMetadata(@Payload() data: { fileName: string }) {
    try {
      const metadata = await this.appService.getVideoMetadata(data.fileName);
      return { success: true, data: metadata };
    } catch (err) {
      return { success: false, error: err?.message ?? String(err) };
    }
  }
}