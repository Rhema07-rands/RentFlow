using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace RentFlow.API.Services
{
    public interface ICloudinaryService
    {
        Task<string> UploadImageAsync(IFormFile file);
        Task<string> UploadMediaAsync(IFormFile file, string folder = "RentFlow_Media");
        Task<bool> DeleteImageAsync(string publicId);
        Task<bool> DeleteMediaAsync(string publicId, bool isVideo = false);
    }

    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration config)
        {
            var cloudinarySection = config.GetSection("Cloudinary");
            var account = new Account(
                cloudinarySection["CloudName"],
                cloudinarySection["ApiKey"],
                cloudinarySection["ApiSecret"]
            );
            _cloudinary = new Cloudinary(account);
            _cloudinary.Api.Secure = true;
        }

        public async Task<string> UploadImageAsync(IFormFile file)
        {
            if (file.Length > 0)
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = "RentFlow"
                };

                var uploadResult = await _cloudinary.UploadAsync(uploadParams);
                return uploadResult.SecureUrl.ToString();
            }

            throw new ArgumentException("File is empty.");
        }

        public async Task<string> UploadMediaAsync(IFormFile file, string folder = "RentFlow_Media")
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty.");

            using var stream = file.OpenReadStream();
            var contentType = file.ContentType?.ToLowerInvariant() ?? "";
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();

            bool isVideo = contentType.StartsWith("video/") ||
                           ext is ".mp4" or ".mov" or ".webm" or ".m4v" or ".avi" or ".mkv" or ".3gp";
            bool isAudio = contentType.StartsWith("audio/") ||
                           ext is ".mp3" or ".wav" or ".m4a" or ".aac" or ".ogg";
            bool isImage = contentType.StartsWith("image/") ||
                           ext is ".jpg" or ".jpeg" or ".png" or ".webp" or ".gif" or ".bmp" or ".svg" or ".heic";

            if (isVideo || isAudio)
            {
                var uploadParams = new VideoUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folder
                };
                var res = await _cloudinary.UploadAsync(uploadParams);
                if (res.Error != null) throw new Exception(res.Error.Message);
                return res.SecureUrl.ToString();
            }
            else if (isImage)
            {
                var uploadParams = new ImageUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folder
                };
                var res = await _cloudinary.UploadAsync(uploadParams);
                if (res.Error != null) throw new Exception(res.Error.Message);
                return res.SecureUrl.ToString();
            }
            else
            {
                var uploadParams = new RawUploadParams
                {
                    File = new FileDescription(file.FileName, stream),
                    Folder = folder
                };
                var res = await _cloudinary.UploadAsync(uploadParams);
                if (res.Error != null) throw new Exception(res.Error.Message);
                return res.SecureUrl.ToString();
            }
        }

        public async Task<bool> DeleteMediaAsync(string publicId, bool isVideo = false)
        {
            var deleteParams = new DeletionParams(publicId)
            {
                ResourceType = isVideo ? ResourceType.Video : ResourceType.Image
            };
            var result = await _cloudinary.DestroyAsync(deleteParams);
            return result.Result == "ok";
        }

        public async Task<bool> DeleteImageAsync(string publicId)
        {
            return await DeleteMediaAsync(publicId, false);
        }
    }
}
