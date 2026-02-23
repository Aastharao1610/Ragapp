import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadPdfToCloudinary(buffer: Buffer, fileName: string) {
  return new Promise<{
    url: string;
    publicId: string;
  }>((resolve, reject) => {
    console.log("Cloudinary called");
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "raw", // 👈 PDF is raw
          folder: "rag-pdfs",
          public_id: fileName.replace(".pdf", ""),
        },
        (error, result) => {
          if (error || !result) {
            reject(error);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        },
      )
      .end(buffer);
  });
}
