export interface PhotoUploadDto {
  url: string;
  publicId: string;
}

export interface AddPhotoRequestDto {
  categories: string[];
  photos: PhotoUploadDto[];
}
