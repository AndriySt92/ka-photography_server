import mongoose, { AnyObject } from "mongoose";

import { HTTP_STATUS } from "../../../constants";
import PhotoController from "../../../controllers/photo.controller";
import PhotoService from "../../../services/photo.service";
import { CustomError } from "../../../utils";
import {
  categories as photoCategories,
  createPaginationFixture,
  createPhotoDocument,
  createPhotoUploadRequest,
} from "../../fixtures/photo.fixture";
import { setupPhotoTestEnvironment } from "../../setup";
import { setupControllerTest } from "../../utils/expressMock";

jest.mock("../../../services/photo.service");
const MockPhotoService = PhotoService as jest.Mocked<typeof PhotoService>;

describe("Photo Controller", () => {
  beforeAll(() => {
    setupPhotoTestEnvironment();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addPhoto", () => {
    it("should successfully add photos and return 201 status", async () => {
      const validPhotoData = createPhotoUploadRequest();
      const { req, res } = setupControllerTest({
        reqBody: validPhotoData as unknown as AnyObject,
      });

      MockPhotoService.addPhoto.mockResolvedValue(undefined);

      await PhotoController.addPhoto(req, res);

      expect(MockPhotoService.addPhoto).toHaveBeenCalledWith(
        validPhotoData.categories,
        validPhotoData.photos,
      );
      expect(res.status).toHaveBeenCalledWith(HTTP_STATUS.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Фото додано успішно (1 з 1)",
      });
    });

    it("should throw CustomError when photos array is empty", async () => {
      const invalidData = { ...createPhotoUploadRequest(), photos: [] };
      const { req, res } = setupControllerTest({
        reqBody: invalidData,
      });

      await expect(PhotoController.addPhoto(req, res)).rejects.toThrow(CustomError);
      await expect(PhotoController.addPhoto(req, res)).rejects.toMatchObject({
        message: "Принаймні одне фото обов'язкове",
        status: HTTP_STATUS.BAD_REQUEST,
      });

      expect(MockPhotoService.addPhoto).not.toHaveBeenCalled();
    });

    it("should throw CustomError when categories array is empty", async () => {
      const invalidData = { ...createPhotoUploadRequest(), categories: [] };
      const { req, res } = setupControllerTest({
        reqBody: invalidData,
      });

      await expect(PhotoController.addPhoto(req, res)).rejects.toThrow(CustomError);
      await expect(PhotoController.addPhoto(req, res)).rejects.toMatchObject({
        message: "Категорії обов'язкові",
        status: HTTP_STATUS.BAD_REQUEST,
      });

      expect(MockPhotoService.addPhoto).not.toHaveBeenCalled();
    });

    it("should throw CustomError when categories is not an array", async () => {
      const invalidData = {
        ...createPhotoUploadRequest(),
        categories: "not-an-array" as unknown as string[],
      };
      const { req, res } = setupControllerTest({
        reqBody: invalidData,
      });

      await expect(PhotoController.addPhoto(req, res)).rejects.toThrow(CustomError);
      expect(MockPhotoService.addPhoto).not.toHaveBeenCalled();
    });

    it("should filter out invalid Cloudinary URLs and only process valid ones", async () => {
      const photosWithInvalid = [
        {
          url: "https://res.cloudinary.com/test-cloud/image/upload/valid.jpg",
          publicId: "valid-id",
        },
        {
          url: "https://invalid-cloudinary.com/image.jpg",
          publicId: "invalid-url",
        },
        {
          url: "https://res.cloudinary.com/wrong-cloud/image/upload/wrong.jpg",
          publicId: "wrong-cloud",
        },
        {
          url: "https://res.cloudinary.com/test-cloud/image/upload/another.jpg",
          publicId: "",
        },
      ];

      const photoData = {
        ...createPhotoUploadRequest(),
        photos: photosWithInvalid,
      };

      const { req, res } = setupControllerTest({
        reqBody: photoData,
      });

      MockPhotoService.addPhoto.mockResolvedValue(undefined);

      await PhotoController.addPhoto(req, res);

      // Only the first photo should be valid
      expect(MockPhotoService.addPhoto).toHaveBeenCalledWith(photoData.categories, [
        photosWithInvalid[0],
      ]);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Фото додано успішно (1 з 4)",
      });
    });

    it("should throw CustomError when no valid photos remain after filtering", async () => {
      const invalidPhotos = [
        {
          url: "https://wrong-cloud.com/image.jpg",
          publicId: "id1",
        },
      ];

      const photoData = {
        ...createPhotoUploadRequest(),
        photos: invalidPhotos,
      };

      const { req, res } = setupControllerTest({
        reqBody: photoData,
      });

      await expect(PhotoController.addPhoto(req, res)).rejects.toThrow(CustomError);
      await expect(PhotoController.addPhoto(req, res)).rejects.toMatchObject({
        message: "Невалідні фото дані",
        status: HTTP_STATUS.BAD_REQUEST,
      });

      expect(MockPhotoService.addPhoto).not.toHaveBeenCalled();
    });

    it("should accept both http and https Cloudinary URLs", async () => {
      const photos = [
        {
          url: "http://res.cloudinary.com/test-cloud/image/upload/http.jpg",
          publicId: "http-id",
        },
        {
          url: "https://res.cloudinary.com/test-cloud/image/upload/https.jpg",
          publicId: "https-id",
        },
      ];

      const photoData = {
        ...createPhotoUploadRequest(),
        photos,
      };

      const { req, res } = setupControllerTest({
        reqBody: photoData,
      });

      MockPhotoService.addPhoto.mockResolvedValue(undefined);

      await PhotoController.addPhoto(req, res);

      expect(MockPhotoService.addPhoto).toHaveBeenCalledWith(photoData.categories, photos);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Фото додано успішно (2 з 2)",
      });
    });
  });

  describe("getPhotos", () => {
    it("should get photos with default pagination and no category", async () => {
      const mockPhotos = [
        createPhotoDocument(),
        createPhotoDocument({ _id: new mongoose.Types.ObjectId() }),
      ];

      const mockPagination = createPaginationFixture({
        total: 2,
      });

      const { req, res } = setupControllerTest({
        reqQuery: {},
      });

      MockPhotoService.getPhotos.mockResolvedValue({
        photos: mockPhotos,
        pagination: mockPagination,
      });

      await PhotoController.getPhotos(req, res);

      expect(MockPhotoService.getPhotos).toHaveBeenCalledWith(undefined, {
        page: 1,
        limit: 12,
        skip: 0,
      });

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: mockPhotos,
        pagination: mockPagination,
      });
    });

    it("should get photos with specified category and pagination", async () => {
      const mockPhotos = [createPhotoDocument()];

      const mockPagination = createPaginationFixture({
        currentPage: 2,
        itemsPerPage: 12,
        hasPrevPage: true,
      });

      const category = photoCategories[0];
      const { req, res } = setupControllerTest({
        reqQuery: { category, page: "2", limit: "10" },
      });

      MockPhotoService.getPhotos.mockResolvedValue({
        photos: mockPhotos,
        pagination: mockPagination,
      });

      await PhotoController.getPhotos(req, res);

      expect(MockPhotoService.getPhotos).toHaveBeenCalledWith(category, {
        page: 2,
        limit: 10,
        skip: 10,
      });

      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        data: mockPhotos,
        pagination: mockPagination,
      });
    });

    it("should handle invalid page/limit parameters by using defaults", async () => {
      const mockPhotos = [createPhotoDocument()];

      const mockPagination = createPaginationFixture();

      const { req, res } = setupControllerTest({
        reqQuery: { page: "invalid", limit: "not-a-number" },
      });

      MockPhotoService.getPhotos.mockResolvedValue({
        photos: mockPhotos,
        pagination: mockPagination,
      });

      await PhotoController.getPhotos(req, res);

      expect(MockPhotoService.getPhotos).toHaveBeenCalledWith(undefined, {
        page: 1,
        limit: 12,
        skip: 0,
      });
    });
  });

  describe("deletePhoto", () => {
    it("should successfully delete photo and return success message", async () => {
      const photoId = "507f1f77bcf86cd799439011";
      const { req, res } = setupControllerTest({
        reqParams: { id: photoId },
      });

      MockPhotoService.deletePhoto.mockResolvedValue(undefined);

      await PhotoController.deletePhoto(req, res);

      expect(MockPhotoService.deletePhoto).toHaveBeenCalledWith(photoId);
      expect(res.json).toHaveBeenCalledWith({
        status: "success",
        message: "Фото видалено успішно",
      });
    });

    it("should propagate errors from PhotoService", async () => {
      const photoId = "invalid-id";
      const { req, res } = setupControllerTest({
        reqParams: { id: photoId },
      });

      const serviceError = new CustomError("Фото не знайдено", HTTP_STATUS.NOT_FOUND);
      MockPhotoService.deletePhoto.mockRejectedValue(serviceError);

      await expect(PhotoController.deletePhoto(req, res)).rejects.toThrow(CustomError);
      await expect(PhotoController.deletePhoto(req, res)).rejects.toMatchObject({
        message: "Фото не знайдено",
        status: HTTP_STATUS.NOT_FOUND,
      });

      expect(MockPhotoService.deletePhoto).toHaveBeenCalledWith(photoId);
    });
  });
});
