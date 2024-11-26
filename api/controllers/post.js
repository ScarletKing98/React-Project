import { db } from "../db.js";
import jwt from "jsonwebtoken";

export const getPosts = (req, res) => {
    const q = req.query.cat
        ? "SELECT * FROM posts WHERE cat=?"
        : "SELECT * FROM posts";

    db.query(q, [req.query.cat], (err, data) => {
        if (err) return res.status(500).send(err);

        return res.status(200).json(data);
    });
};

export const getPost = (req, res) => {
    const q = "SELECT p.id, u.username, p.title, p.desc, p.img, u.img AS userImg, p.cat, p.date FROM users u JOIN posts p ON u.id = p.uid WHERE p.id = ?";
    db.query(q, [req.params.id], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.status(200).json(data[0]);
    });
};

export const addPost = (req, res) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json("Not authenticated!");

    jwt.verify(token, "jwtkey", (err, userInfo) => {
        if (err) return res.status(403).json("Token is not valid!");

        const q = "INSERT INTO posts (title, `desc`, img, cat, date, uid) VALUES (?, ?, ?, ?, ?, ?)";

        const values = [
            req.body.title,
            req.body.desc,
            req.body.img,
            req.body.cat,
            req.body.date,
            userInfo.id,
        ];

        db.query(q, values, (err, data) => {
            if (err) return res.status(500).json(err);
            return res.json("Post has been created.");
        });
    });
};

export const deletePost = (req, res) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json("Not authenticated!");

    jwt.verify(token, "jwtkey", (err, userInfo) => {
        if (err) return res.status(403).json("Token is not valid!");

        const postId = req.params.id;
        const q = "DELETE FROM posts WHERE id = ? AND uid = ?";

        db.query(q, [postId, userInfo.id], (err, data) => {
            if (err) return res.status(403).json("You can delete only your post!");

            return res.json("Your post has been deleted!");
        });
    });
};

export const updatePost = (req, res) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json("Not authenticated!");

    jwt.verify(token, "jwtkey", (err, userInfo) => {
        if (err) return res.status(403).json("Token is not valid!");

        const postId = req.params.id;

        const q = "UPDATE posts SET title = ?, `desc` = ?, img = ?, cat = ? WHERE id = ? AND uid = ?";

        const values = [
            req.body.title,
            req.body.desc,
            req.body.img,
            req.body.cat,
        ];

        db.query(q, [...values, postId, userInfo.id], (err, data) => {
            if (err) return res.status(500).json(err);
            return res.json("Post has been updated.");
        });
    });
};

export const getComments = (req, res) => {
    const postId = req.params.id;
    const q = `
        SELECT c.id, c.text, c.date, u.username, c.parent_comment_id 
        FROM comments c 
        JOIN users u ON c.userId = u.id 
        WHERE c.postId = ?
        ORDER BY c.date DESC;
    `;
    
    db.query(q, [postId], (err, data) => {
        if (err) return res.status(500).json(err);

        const comments = buildCommentTree(data);
        return res.status(200).json(comments);
    });
};

const buildCommentTree = (comments) => {
    const map = {};
    const roots = [];

    comments.forEach(comment => {
        comment.replies = [];
        map[comment.id] = comment;
    });

    comments.forEach(comment => {
        if (comment.parent_comment_id) {
            const parent = map[comment.parent_comment_id];
            parent.replies.push(comment);
        } else {
            roots.push(comment);
        }
    });

    return roots;
};
export const addComment = (req, res) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json("Not authenticated!");

    jwt.verify(token, "jwtkey", (err, userInfo) => {
        if (err) return res.status(403).json("Token is not valid!");

        const q = "INSERT INTO comments (text, postId, userId, parent_comment_id) VALUES (?, ?, ?, ?)";
        const values = [req.body.text, req.params.id, userInfo.id, req.body.parent_comment_id || null];

        db.query(q, values, (err, data) => {
            if (err) return res.status(500).json(err);

            const commentId = data.insertId;
            db.query(
                `SELECT c.id, c.text, c.date, u.username, c.parent_comment_id
                 FROM comments c
                 JOIN users u ON c.userId = u.id
                 WHERE c.id = ?`,
                [commentId],
                (err, result) => {
                    if (err) return res.status(500).json(err);
                    return res.status(200).json(result[0]);
                }
            );
        });
    });
};

export const deleteComment = (req, res) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json("Not authenticated!");

    jwt.verify(token, "jwtkey", (err, userInfo) => {
        if (err) return res.status(403).json("Token is not valid!");

        const commentId = req.params.commentId;
        const q = "DELETE FROM comments WHERE id = ? AND userId = ?";

        db.query(q, [commentId, userInfo.id], (err, data) => {
            if (err) return res.status(403).json("You can delete only your comment!");

            return res.json("Comment has been deleted!");
        });
    });
};