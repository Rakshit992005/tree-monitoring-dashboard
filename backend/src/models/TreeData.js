const mongoose = require('mongoose');

const TreeDataSchema = new mongoose.Schema(
  {
    // Unique identifier for the tree (assigned by the Pi operator)
    treeId: {
      type: String,
      required: [true, 'treeId is required'],
      trim: true,
    },

    // Distance reading from the Time-of-Flight sensor (in centimetres)
    tofMeasurement: {
      type: Number,
      required: [true, 'tofMeasurement is required'],
    },

    // Only the filename is stored — the full file lives in /uploads/
    imageName: {
      type: String,
      default: null,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

module.exports = mongoose.model('TreeData', TreeDataSchema);
