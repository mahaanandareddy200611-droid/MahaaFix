const mongoose =require("mongoose")

const reviewSchema = new mongoose.Schema(
  {
    workRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WorkRecord",
      required: true,
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    review: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

reviewSchema.index(
  { workRecord: 1, reviewedBy: 1 },
  { unique: true }
);

module.exports = mongoose.model("Review", reviewSchema);