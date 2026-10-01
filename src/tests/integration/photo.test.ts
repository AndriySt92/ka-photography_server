import request from "supertest";

import app from "../../../src/app";
import { HTTP_STATUS } from "../../../src/constants";
import Photos from "../../../src/models/photo.model";
import { cloudinary } from "../../config";
import {
  categories,
  createPhotoDocument,
  createPhotoUploadRequest,
  PhotoDocumentFixture,
} from "../fixtures";
import { setupPhotoTestEnvironment } from "../setup/envirement-setup";
import { clearDatabase, closeDatabase, connect } from "../setup/mongodb";
import {
  createTestAdmin,
  generateExpiredToken,
  loginAdminAndGetCookies,
} from "../utils/auth-helpers";

jest.mock("../../../src/config/cloudinary", () => ({
  uploader: {
    destroy: jest.fn().mockResolvedValue({ result: "ok" }),
  },
}));

describe("Photo API Integration Tests", () => {
  let authCookies: string[] = [];
  let allowedCategories: string[] = [];

  beforeAll(async () => {
    await connect();
    setupPhotoTestEnvironment();

    allowedCategories = categories;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    await createTestAdmin();

    authCookies = await loginAdminAndGetCookies(app);
  });

  describe("GET /api/photos", () => {
    it("should return paginated photos without authentication", async () => {
      await Photos.create([createPhotoDocument(), createPhotoDocument(), createPhotoDocument()]);

      const response = await request(app)
        .get("/api/photos")
        .query({ page: 1, limit: 2 })
        .expect("Content-Type", /json/)
        .expect(HTTP_STATUS.OK);

      expect(response.body).toHaveProperty("status", "success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it("should filter photos by category", async () => {
      const categoryToFilter = allowedCategories[2];
      const createdPhotos = createPhotoDocument({ categories: [categoryToFilter] });

      await Photos.create(createdPhotos);

      const response = await request(app)
        .get("/api/photos")
        .query({ category: categoryToFilter })
        .expect(HTTP_STATUS.OK);

      expect(response.body.status).toBe("success");
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);

      response.body.data.forEach((photo: PhotoDocumentFixture) => {
        expect(photo.categories).toContain(categoryToFilter);
      });
    });

    it("should return empty array for non-existing category", async () => {
      await Photos.create(createPhotoDocument());

      const response = await request(app)
        .get("/api/photos")
        .query({ category: "non-existing-category" })
        .expect(HTTP_STATUS.OK);

      expect(response.body.status).toBe("success");
      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it("should use default pagination values when invalid parameters provided", async () => {
      const response = await request(app)
        .get("/api/photos")
        .query({ page: "invalid", limit: "not-a-number" })
        .expect(HTTP_STATUS.OK);

      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.itemsPerPage).toBeGreaterThan(0);
    });
  });

  describe("POST /api/photos", () => {
    it("should add photos successfully with authentication", async () => {
      const category = allowedCategories[0];
      const photoData = createPhotoUploadRequest({ categories: [category] });

      const response = await request(app)
        .post("/api/photos")
        .set("Cookie", authCookies)
        .send(photoData)
        .expect("Content-Type", /json/);

      expect(response.status).toBe(HTTP_STATUS.CREATED);
      expect(response.body).toHaveProperty("status", "success");
      expect(response.body.message).toContain("Фото додано успішно");

      // Check photos are saved in the database
      const photosInDb = await Photos.find({ categories: { $in: [category] } });
      expect(photosInDb.length).toBeGreaterThan(0);
    });

    it("should reject request without authentication", async () => {
      const photoData = createPhotoUploadRequest();

      const response = await request(app)
        .post("/api/photos")
        .send(photoData)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body).toHaveProperty("status", "error");
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should validate required fields - empty photos array", async () => {
      const invalidData = createPhotoUploadRequest({ photos: [] });

      const response = await request(app)
        .post("/api/photos")
        .set("Cookie", authCookies)
        .send(invalidData)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toContain("Принаймні одне фото обов'язкове");
    });

    it("should validate required fields - missing categories", async () => {
      const invalidData = createPhotoUploadRequest({ categories: [] });

      const response = await request(app)
        .post("/api/photos")
        .set("Cookie", authCookies)
        .send(invalidData)
        .expect(HTTP_STATUS.BAD_REQUEST);

      expect(response.body.message).toContain("Категорії обов'язкові");
    });

    it("should save only valid photos and skip invalid ones", async () => {
      const mixedData = createPhotoUploadRequest({
        photos: [
          {
            url: "https://res.cloudinary.com/test-cloud/image/upload/valid1.jpg",
            publicId: "valid1",
          },
          {
            url: "https://wrong-domain.com/invalid.jpg", // not Cloudinary URL
            publicId: "invalid1",
          },
          {
            url: "https://res.cloudinary.com/test-cloud/image/upload/valid2.jpg",
            publicId: "valid2",
          },
        ],
      });

      const response = await request(app)
        .post("/api/photos")
        .set("Cookie", authCookies)
        .send(mixedData)
        .expect(HTTP_STATUS.CREATED);

      // saved only 2 valid photos from 3
      expect(response.body.message).toContain("Фото додано успішно (2 з 3)");

      // check in database
      const savedPhotos = await Photos.find({});
      expect(savedPhotos).toHaveLength(2);

      // check saved valid photos
      const savedUrls = savedPhotos.map((photo) => photo.photoUrl);
      expect(savedUrls).toContain("https://res.cloudinary.com/test-cloud/image/upload/valid1.jpg");
      expect(savedUrls).toContain("https://res.cloudinary.com/test-cloud/image/upload/valid2.jpg");
      expect(savedUrls).not.toContain("https://wrong-domain.com/invalid.jpg");
    });
  });

  describe("DELETE /api/photos/:id", () => {
    let testPhoto: PhotoDocumentFixture;

    beforeEach(async () => {
      testPhoto = await Photos.create(createPhotoDocument());
    });

    it("should delete photo successfully with authentication", async () => {
      // check photo exists before deletion
      const photoBefore = await Photos.findById(testPhoto._id);
      expect(photoBefore).not.toBeNull();

      const response = await request(app)
        .delete(`/api/photos/${testPhoto._id}`)
        .set("Cookie", authCookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body).toHaveProperty("status", "success");
      expect(response.body.message).toBe("Фото видалено успішно");

      // check in database photo is deleted
      const photoAfter = await Photos.findById(testPhoto._id);
      expect(photoAfter).toBeNull();
    });

    it("should reject delete without authentication", async () => {
      const response = await request(app)
        .delete(`/api/photos/${testPhoto._id}`)
        .expect(HTTP_STATUS.UNAUTHORIZED);

      expect(response.body).toHaveProperty("status", "error");
      expect(response.body.message).toContain("Unauthorized");

      // the photo should still exist
      const photoAfter = await Photos.findById(testPhoto._id);
      expect(photoAfter).not.toBeNull();
    });

    it("should return 404 for non-existing photo", async () => {
      const nonExistingId = "507f1f77bcf86cd799439011";

      const response = await request(app)
        .delete(`/api/photos/${nonExistingId}`)
        .set("Cookie", authCookies)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.message).toContain("Фото не знайдено");
    });

    it("should delete photo with publicId (Cloudinary deletion)", async () => {
      const publicId = "cloud-public-id";
      const photoWithPublicId = await Photos.create(
        createPhotoDocument({
          publicId,
        }),
      );

      (cloudinary.uploader.destroy as jest.Mock).mockClear();

      const response = await request(app)
        .delete(`/api/photos/${photoWithPublicId._id}`)
        .set("Cookie", authCookies)
        .expect(HTTP_STATUS.OK);

      expect(response.body.status).toBe("success");
      expect(cloudinary.uploader.destroy as jest.Mock).toHaveBeenCalledWith(publicId);

      // Verify photo is deleted from database
      const photoAfter = await Photos.findById(photoWithPublicId._id);
      expect(photoAfter).toBeNull();
    });

    it("should handle invalid photo ID format", async () => {
      const response = await request(app)
        .delete("/api/photos/invalid-id-format")
        .set("Cookie", authCookies)
        .expect(HTTP_STATUS.NOT_FOUND);

      expect(response.body.message).toContain("Фото не знайдено");
    });
  });

  describe("Error handling", () => {
    it("should handle internal server errors gracefully", async () => {
      // override Photos.find to throw an error
      const originalFind = Photos.find;
      Photos.find = jest.fn().mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      const response = await request(app).get("/api/photos");

      expect(response.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(response.body.status).toBe("error");
      expect(response.body.message).toContain("Database connection failed");

      // restore original Photos.find method
      Photos.find = originalFind;
    });

    it("should handle expired authentication token", async () => {
      const expiredToken = generateExpiredToken();

      const expiredCookies = [`auth_token=${expiredToken}`];

      const response = await request(app)
        .post("/api/photos")
        .set("Cookie", expiredCookies)
        .send(createPhotoUploadRequest());

      expect([HTTP_STATUS.UNAUTHORIZED, HTTP_STATUS.INTERNAL_SERVER_ERROR]).toContain(
        response.status,
      );
      expect(response.body.status).toBe("error");
    });
  });
});
