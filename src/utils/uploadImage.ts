import { type UploadApiErrorResponse, type UploadApiResponse, v2 as cloudinary } from "cloudinary";

const uploadImage = async (imageFile: Express.Multer.File): Promise<string> => {
  try {
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "photos",
          format: "webp",
          quality: "auto",
          fetch_format: "auto",
          transformation: [{ width: 800, height: 800, crop: "limit" }, { quality: "auto:good" }],
          timeout: 120000, // 2 minutes per file
          async: false,
        },
        (error: UploadApiErrorResponse | undefined, result?: UploadApiResponse) => {
          if (error) {
            const msg = error.message ?? "Cloudinary upload error";
            return reject(new Error(msg));
          }
          if (!result) return reject(new Error("Empty response from Cloudinary"));
          resolve(result);
        },
      );

      uploadStream.end(imageFile.buffer);
    });

    return result.secure_url;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    } else if (typeof error === "string") {
      throw new Error(`Failed to upload image: ${error}`);
    } else {
      throw new Error("Failed to upload image: Unknown error occurred");
    }
  }
};

export default uploadImage;
