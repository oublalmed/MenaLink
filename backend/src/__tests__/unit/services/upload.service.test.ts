jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn((_opts: unknown, cb: (err: null, result: unknown) => void) => {
        const stream = { end: jest.fn() };
        // simulate async upload success
        process.nextTick(() => cb(null, {
          secure_url: 'https://res.cloudinary.com/menalink/image/upload/test.jpg',
          public_id: 'menalink/avatars/test.jpg',
          width: 800, height: 600, format: 'jpg', bytes: 102400,
        }));
        return stream;
      }),
      destroy: jest.fn().mockResolvedValue({ result: 'ok' }),
    },
  },
}));

jest.mock('sharp', () => jest.fn(() => ({
  resize: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image-data')),
})));

import { uploadFile, deleteFile } from '../../../services/upload.service';

process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';

const JPEG_BUFFER = Buffer.from('mock-jpeg-data');

describe('upload.service', () => {
  describe('uploadFile', () => {
    it('upload un JPEG avec succès (Cloudinary mock)', async () => {
      const result = await uploadFile(JPEG_BUFFER, 'avatar.jpg', 'image/jpeg', 'avatars');
      expect(result.url).toContain('cloudinary.com');
      expect(result.publicId).toBeDefined();
    });

    it('rejette un MIME non supporté', async () => {
      await expect(uploadFile(JPEG_BUFFER, 'file.pdf', 'application/pdf', 'avatars'))
        .rejects.toThrow();
    });

    it('rejette un fichier trop grand (> 5 Mo)', async () => {
      const bigBuffer = Buffer.alloc(6 * 1024 * 1024);
      await expect(uploadFile(bigBuffer, 'big.jpg', 'image/jpeg', 'avatars'))
        .rejects.toThrow();
    });
  });

  describe('deleteFile', () => {
    it('appelle cloudinary.uploader.destroy', async () => {
      await expect(deleteFile('menalink/avatars/test.jpg')).resolves.toBeUndefined();
    });
  });
});
