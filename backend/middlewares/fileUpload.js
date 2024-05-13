// backend/middleware/fileUpload.js

import multer from 'multer';
import path from 'path';

// Define storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Specify destination folder based on file type
    if (file.fieldname === 'playerImage') {
      cb(null, 'uploads/players');
    } else if (file.fieldname === 'teamLogo') {
      cb(null, 'uploads/teams');
    } else if (file.fieldname === 'leagueLogo') {
      cb(null, 'uploads/leagues');
    } else {
      cb(new Error('Invalid file field'));
    }
  },
  filename: (req, file, cb) => {
    // Generate unique file name
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow only JPEG and PNG files
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG and PNG files are allowed.'));
  }
};

// Set up file upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 }, // 1 MB file size limit
  fileFilter: fileFilter
});

export default upload;
