import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Course } from './schemas/course.schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Client } from 'minio';

@Injectable()
export class AppService {
  private minioClient: Client;

  constructor(@InjectModel(Course.name) private courseModel: Model<Course>) {
    // Khởi tạo MinIO client
    this.minioClient = new Client({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'admin',
      secretKey: 'admin123',
    });
  }

  async create(dto: CreateCourseDto) {
    const created = new this.courseModel(dto);
    return created.save();
  }

  async getAll() : Promise<Course[]> {
    return await this.courseModel.find().exec();
  }

  async getById(id: string): Promise<Course> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Course not found');
    }

    const course = await this.courseModel.findById(id).exec();
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async update(id: string, dto: UpdateCourseDto): Promise<Course> {
    if (!isValidObjectId(id)) {
      throw new NotFoundException('Course not found');
    }

    const updated = await this.courseModel
      .findByIdAndUpdate(id, dto, { new: true, runValidators: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Course not found');
    }
    return updated;
  }

  async remove(id: string): Promise<{ deleted: boolean; deletedId?: string }> {
    if (!isValidObjectId(id)) {
      return { deleted: false };
    }

    const deleted = await this.courseModel.findByIdAndDelete(id).exec();
    return { deleted: !!deleted, deletedId: deleted ? String(deleted._id) : undefined };
  }

   async uploadVideo(fileName: string, buffer: Buffer) {
    const bucketName = 'videos';
    
    try {
      // Đảm bảo bucket tồn tại
      const exists = await this.minioClient.bucketExists(bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(bucketName, 'us-east-1');
        // Set bucket policy để public read nếu cần
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };
        await this.minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      }

      // Tạo tên file unique với timestamp
      const timestamp = Date.now();
      const uniqueFileName = `${timestamp}-${fileName}`;

      // Upload video với metadata
      const metaData = {
        'Content-Type': 'video/mp4',
        'X-Upload-Date': new Date().toISOString(),
      };
      
      await this.minioClient.putObject(
        bucketName,
        uniqueFileName,
        buffer,
        buffer.length,
        metaData,
      );

      // Tạo URL
      const minioEndpoint = 'localhost';
      const minioPort = '9000';
      const protocol = 'http';
      const url = `${protocol}://${minioEndpoint}:${minioPort}/${bucketName}/${uniqueFileName}`;

      return {
        url,
        fileName: uniqueFileName,
        bucketName,
        size: buffer.length,
      };
    } catch (error) {
      throw new Error(`Failed to upload video to MinIO: ${error.message}`);
    }
  }

  async getVideoUrl(fileName: string): Promise<string> {
    const bucketName = 'videos';
    try {
      // Tạo presigned URL với thời gian hết hạn 7 ngày (604800 giây)
      const url = await this.minioClient.presignedGetObject(bucketName, fileName, 24 * 60 * 60);
      return url;
    } catch (error) {
      throw new NotFoundException(`Video not found: ${error.message}`);
    }
  }

  async getVideoStream(fileName: string) {
    const bucketName = 'videos';
    try {
      // Lấy stream từ MinIO
      const stream = await this.minioClient.getObject(bucketName, fileName);
      return stream;
    } catch (error) {
      throw new NotFoundException(`Video not found: ${error.message}`);
    }
  }

  async getVideoMetadata(fileName: string) {
    const bucketName = 'videos';
    try {
      const stat = await this.minioClient.statObject(bucketName, fileName);
      return {
        size: stat.size,
        etag: stat.etag,
        lastModified: stat.lastModified,
        metaData: stat.metaData,
      };
    } catch (error) {
      throw new NotFoundException(`Video not found: ${error.message}`);
    }
  }
}