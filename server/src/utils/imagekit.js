import imagekit from "imagekit";

const imagekitInstance = new imagekit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

async function uploadfile(buffer){
    try {
        const result = await imagekitInstance.upload({
            file: buffer,
            fileName: `avatar_${Date.now()}.jpg`,
            folder: "avatars", // Optional: specify a folder in ImageKit
        });
        return result.url;
    } catch (error) {
        console.error("Image upload failed:", error);
        throw new Error("Image upload failed");
    }
}

export { uploadfile };