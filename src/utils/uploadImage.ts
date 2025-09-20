import cloudinary from "../config/cloudinary";

const uploadImage = async (imageFile: Express.Multer.File) => {
  const b64 = Buffer.from(imageFile.buffer).toString("base64");
  const dataURI = "data:" + imageFile.mimetype + ";base64," + b64;
  const res = await cloudinary.uploader.upload(dataURI, {
    folder: "photos",
    format: "webp",
    quality: "auto",
    fetch_format: "auto",
    transformation: [{ width: 800, height: 800, crop: "limit" }, { quality: "auto:good" }],
  });
  return res.secure_url;
};

export default uploadImage;
