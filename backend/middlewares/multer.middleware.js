import multer from "multer";
import { nanoid } from "nanoid";
import path from "path";
const storage =multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './public/temp');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname+nanoid(10)+path.extname(file.originalname));
    }
})
export const uploadFile=multer({storage})