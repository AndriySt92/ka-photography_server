export const setupBaseTestEnvironment = (): void => {
  process.env.JWT_SECRET_KEY = "test-secret-key";
  process.env.NODE_ENV = "test";
  process.env.PORT = "3000";
};

export const setupPhotoTestEnvironment = (): void => {
  setupBaseTestEnvironment();
  process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
};

export const setupAdminTestEnvironment = (): void => {
  setupBaseTestEnvironment();
};
