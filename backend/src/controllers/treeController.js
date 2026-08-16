const TreeData = require('../models/TreeData');

/**
 * POST /api/tree/data
 * Called by the Raspberry Pi to submit a new reading.
 * Requires X-Secret-Key header and multipart/form-data body.
 *
 * Body fields:
 *   treeId        (string)  — Tree identifier
 *   tofMeasurement (number) — TOF sensor reading in cm
 *   image         (file)    — Photo of the tree (optional but recommended)
 */
const addTreeData = async (req, res) => {
  try {
    const { treeId, tofMeasurement } = req.body;

    // Validate required fields
    if (!treeId || tofMeasurement === undefined) {
      return res.status(400).json({
        success: false,
        message: 'treeId and tofMeasurement are required fields',
      });
    }

    // If a file was uploaded, multer puts it in req.file
    const imageName = req.file ? req.file.filename : null;

    const newRecord = await TreeData.create({
      treeId,
      tofMeasurement: parseFloat(tofMeasurement),
      imageName,
    });

    return res.status(201).json({
      success: true,
      message: 'Data saved successfully',
      data: newRecord,
    });
  } catch (error) {
    console.error('Error saving tree data:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while saving data',
    });
  }
};

/**
 * GET /api/tree/data
 * Returns all tree records sorted by newest first.
 * Each record includes a full imageUrl for the frontend to display.
 */
const getAllTreeData = async (req, res) => {
  try {
    const records = await TreeData.find().sort({ createdAt: -1 });

    // Build a full URL for the image so the frontend can render it directly
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const dataWithImageUrls = records.map((record) => ({
      _id: record._id,
      treeId: record.treeId,
      tofMeasurement: record.tofMeasurement,
      imageName: record.imageName,
      imageUrl: record.imageName
        ? `${baseUrl}/uploads/${record.imageName}`
        : null,
      createdAt: record.createdAt,
    }));

    return res.status(200).json({
      success: true,
      count: dataWithImageUrls.length,
      data: dataWithImageUrls,
    });
  } catch (error) {
    console.error('Error fetching tree data:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching data',
    });
  }
};

module.exports = { addTreeData, getAllTreeData };
