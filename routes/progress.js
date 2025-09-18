import express from "express";

const router = express.Router();

// Temporary in-memory storage (later replace with MongoDB)
let userProgress = {
    xp: 0,
    level: 0,
    coins: 0,
    category: 1,
    stage: 1
};


// GET progress
router.get("/progress", (req, res) => {
    res.json(userProgress);
});

// POST save progress
router.post("/progress", (req, res) => {
    const { xp, level, coins } = req.body;
    userProgress = { xp, level, coins };
    res.json({ success: true, progress: userProgress });
});

//
export default router;
//
// import mongoose from "mongoose";
//
// const ProgressSchema = new mongoose.Schema({
//     userId: String,
//     xp: Number,
//     level: Number,
//     coins: Number
// });
//
// const Progress = mongoose.model("Progress", ProgressSchema);
//
// // In POST /progress
// router.post("/progress", async (req, res) => {
//     const { userId, xp, level, coins,category,stage } = req.body;
//     await Progress.findOneAndUpdate(
//         { userId },
//         { xp, level, coins,category,stage },
//         { upsert: true }
//     );
//     res.json({ success: true });
// });
//
// // In GET /progress
// router.get("/progress/:userId", async (req, res) => {
//     const progress = await Progress.findOne({ userId: req.params.userId });
//     res.json(progress || { xp: 0, level: 1, coins: 0 });
// });
//
