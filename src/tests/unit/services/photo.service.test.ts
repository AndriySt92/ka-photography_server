import mongoose from "mongoose";

import cloudinary from "../../../config/cloudinary";
import { HTTP_STATUS } from "../../../constants";
import Photos from "../../../models/photo.model";
import PhotoService from "../../../services/photo.service";
import { createPhotoDocument } from "../../fixtures";

jest.mock("../../../models/photo.model");
jest.mock("../../../config/cloudinary");

type MockPhotoModel = {
  create: jest.Mock;
  find: jest.Mock;
  countDocuments: jest.Mock;
  findById: jest.Mock;
};

type MockCloudinary = {
  uploader: {
    destroy: jest.Mock;
  };
};

const MockPhotos = Photos as jest.Mocked<typeof Photos> & MockPhotoModel;
const mockCloudinary = cloudinary as jest.Mocked<typeof cloudinary> & MockCloudinary;

interface TestPhoto {
  url: string;
  publicId: string;
}

interface TestPhotoDocument {
  _id: string;
  photoUrl: string;
  publicId?: string;
}

interface PageOptions {
  page: number;
  limit: number;
  skip: number;
}

describe("Photo Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addPhoto", () => {
    it("should create photo documents for each uploaded photo", async () => {
      const categories = ["group", "express"];
      const photos: TestPhoto[] = [
        { url: "http://example.com/1.jpg", publicId: "pub1" },
        { url: "http://example.com/2.jpg", publicId: "pub2" },
      ];

      MockPhotos.create.mockResolvedValue({});

      await PhotoService.addPhoto(categories, photos);

      expect(MockPhotos.create).toHaveBeenCalledTimes(2);
      expect(MockPhotos.create).toHaveBeenCalledWith({
        categories,
        photoUrl: photos[0].url,
        publicId: photos[0].publicId,
      });
      expect(MockPhotos.create).toHaveBeenCalledWith({
        categories,
        photoUrl: photos[1].url,
        publicId: photos[1].publicId,
      });
    });
  });

  describe("getPhotos", () => {
    it("should return paginated photos without category filter", async () => {
      const pageOptions: PageOptions = { page: 1, limit: 2, skip: 0 };
      const photosArray: TestPhotoDocument[] = [
        { _id: "1", photoUrl: "a" },
        { _id: "2", photoUrl: "b" },
      ];
      const total = 3;

      const mockFindChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(photosArray),
      };

      MockPhotos.find.mockReturnValue(mockFindChain);
      MockPhotos.countDocuments.mockResolvedValue(total);

      const result = await PhotoService.getPhotos("", pageOptions);

      expect(MockPhotos.find).toHaveBeenCalledWith({});

      expect(result.photos).toEqual(photosArray);
      expect(result.pagination.total).toBe(total);
      expect(result.pagination.totalPages).toBe(Math.ceil(total / pageOptions.limit));
      expect(result.pagination.currentPage).toBe(pageOptions.page);
      expect(result.pagination.itemsPerPage).toBe(pageOptions.limit);
      expect(result.pagination.hasNextPage).toBe(true); // page 1 of 2
      expect(result.pagination.hasPrevPage).toBe(false);
    });

    it("should apply category filter when provided", async () => {
      const pageOptions: PageOptions = { page: 2, limit: 2, skip: 0 };
      const category = "nature";
      const photosArray: TestPhotoDocument[] = [{ _id: "3", photoUrl: "c" }];
      const total = 3;

      const mockFindChain = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(photosArray),
      };

      const expectedQuery = { categories: { $in: [category] } };

      MockPhotos.find.mockImplementation((query) => {
        expect(query).toEqual(expectedQuery);
        return mockFindChain;
      });

      MockPhotos.countDocuments.mockResolvedValue(total);

      const result = await PhotoService.getPhotos(category, pageOptions);

      expect(MockPhotos.find).toHaveBeenCalledWith(expectedQuery);
      expect(result.photos).toEqual(photosArray);
      // page 2 of ceil(3/2)=2 => hasNext false, hasPrev true
      expect(result.pagination.hasNextPage).toBe(false);
      expect(result.pagination.hasPrevPage).toBe(true);
    });
  });

  describe("deletePhoto", () => {
    it("should throw CustomError when photo not found", async () => {
      MockPhotos.findById.mockResolvedValue(null);

      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(PhotoService.deletePhoto(nonExistentId)).rejects.toMatchObject({
        message: "Фото не знайдено",
        status: HTTP_STATUS.NOT_FOUND,
      });

      expect(MockPhotos.findById).toHaveBeenCalledWith(nonExistentId);
    });

    it("should throw CustomError when invalid photoId format", async () => {
      await expect(PhotoService.deletePhoto("invalid-format")).rejects.toMatchObject({
        message: "Фото не знайдено",
        status: HTTP_STATUS.NOT_FOUND,
      });

      // Verify findById is not called when validation fails
      expect(MockPhotos.findById).not.toHaveBeenCalled();
    });

    it("should delete from Cloudinary and database when photo has publicId", async () => {
      const photoId = new mongoose.Types.ObjectId().toString();
      const publicId = "cloudinary-public-id-123";

      const photoDoc = {
        ...createPhotoDocument({ _id: new mongoose.Types.ObjectId(photoId), publicId }),
        deleteOne: jest.fn().mockResolvedValue({}),
      };

      MockPhotos.findById.mockResolvedValue(photoDoc);
      mockCloudinary.uploader.destroy.mockResolvedValue({ result: "ok" });

      await PhotoService.deletePhoto(photoId);

      expect(MockPhotos.findById).toHaveBeenCalledWith(photoId);
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(publicId);
      expect(photoDoc.deleteOne).toHaveBeenCalled();
    });

    it("should only delete from database when photo has no publicId", async () => {
      const photoId = new mongoose.Types.ObjectId().toString();

      const photoDoc = {
        ...createPhotoDocument({ _id: new mongoose.Types.ObjectId(photoId) }),
        publicId: "", // Empty string
        deleteOne: jest.fn().mockResolvedValue({}),
      };

      MockPhotos.findById.mockResolvedValue(photoDoc);

      await PhotoService.deletePhoto(photoId);

      expect(MockPhotos.findById).toHaveBeenCalledWith(photoId);
      expect(mockCloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(photoDoc.deleteOne).toHaveBeenCalled();
    });

    it("should only delete from database when photo has undefined publicId", async () => {
      const photoId = new mongoose.Types.ObjectId().toString();

      const photoDoc = {
        ...createPhotoDocument({ _id: new mongoose.Types.ObjectId(photoId) }),
        publicId: undefined, // Undefined
        deleteOne: jest.fn().mockResolvedValue({}),
      };

      MockPhotos.findById.mockResolvedValue(photoDoc);

      await PhotoService.deletePhoto(photoId);

      expect(MockPhotos.findById).toHaveBeenCalledWith(photoId);
      expect(mockCloudinary.uploader.destroy).not.toHaveBeenCalled();
      expect(photoDoc.deleteOne).toHaveBeenCalled();
    });

    it("should propagate Cloudinary errors if deletion fails", async () => {
      const photoId = new mongoose.Types.ObjectId().toString();
      const publicId = "cloudinary-error-id";

      const photoDoc = {
        ...createPhotoDocument({ _id: new mongoose.Types.ObjectId(photoId), publicId }),
        deleteOne: jest.fn().mockResolvedValue({}),
      };

      MockPhotos.findById.mockResolvedValue(photoDoc);
      const cloudinaryError = new Error("Cloudinary API error");
      mockCloudinary.uploader.destroy.mockRejectedValue(cloudinaryError);

      await expect(PhotoService.deletePhoto(photoId)).rejects.toThrow(cloudinaryError);

      expect(MockPhotos.findById).toHaveBeenCalledWith(photoId);
      expect(mockCloudinary.uploader.destroy).toHaveBeenCalledWith(publicId);
      expect(photoDoc.deleteOne).not.toHaveBeenCalled(); // Should not delete from DB if Cloudinary fails
    });
  });
});
