import express from "express";
import {
  addPost, 
  deletePost, 
  getPost, 
  getPosts, 
  updatePost, 
  getComments, 
  addComment,
  deleteComment 
} from "../controllers/post.js";

const router = express.Router();

router.get("/", getPosts);
router.get("/:id", getPost);
router.post("/", addPost);
router.delete("/:id", deletePost);
router.put("/:id", updatePost);
router.get("/:id/comments", getComments);
router.post("/:id/comments", addComment);
router.delete("/:id/comments/:commentId", deleteComment); 

export default router;