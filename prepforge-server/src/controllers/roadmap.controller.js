const Roadmap = require('../models/Roadmap.model');
const Solution = require('../models/Solution.model');
const Problem = require('../models/Problem.model');
const ApiResponse = require('../utils/apiResponse');
const asyncHandler = require('../middleware/asyncHandler');
const { getCompletedProblemIds } = require('../services/completion.service');

/**
 * GET /api/v1/roadmaps
 * All roadmaps (system + user's personal).
 */
const getAllRoadmaps = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const [systemRoadmaps, personalRoadmaps] = await Promise.all([
    Roadmap.find({ isSystem: true }).lean(),
    Roadmap.find({ createdBy: userId, isSystem: false }).lean(),
  ]);

  // Compute progress for each roadmap using union of submissions + manual completions
  const completedIds = await getCompletedProblemIds(userId);
  const solvedIds = new Set(completedIds.map((id) => id.toString()));

  const enrichRoadmap = (roadmap) => {
    const total = roadmap.problemIds.length;
    const solved = roadmap.problemIds.filter((pid) => solvedIds.has(pid.toString())).length;
    return {
      ...roadmap,
      problemCount: total,
      userProgress: {
        solved,
        percentage: total > 0 ? Math.round((solved / total) * 100) : 0,
      },
    };
  };

  return ApiResponse.success(res, {
    system: systemRoadmaps.map(enrichRoadmap),
    personal: personalRoadmaps.map(enrichRoadmap),
  });
});

/**
 * GET /api/v1/roadmaps/system
 */
const getSystemRoadmaps = asyncHandler(async (req, res) => {
  const roadmaps = await Roadmap.find({ isSystem: true }).lean();
  return ApiResponse.success(res, { roadmaps });
});

/**
 * GET /api/v1/roadmaps/mine
 */
const getMyRoadmaps = asyncHandler(async (req, res) => {
  const roadmaps = await Roadmap.find({ createdBy: req.user._id, isSystem: false }).lean();
  return ApiResponse.success(res, { roadmaps });
});

/**
 * GET /api/v1/roadmaps/:id
 * Single roadmap with problem list and user progress.
 */
const getRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findById(req.params.id)
    .populate('problemIds', 'title difficulty topic week orderIndex patterns leetcodeUrl')
    .lean();

  if (!roadmap) return ApiResponse.notFound(res, 'Roadmap not found.');

  // Compute per-problem completion status using union of submissions + manual completions
  const completedIds = await getCompletedProblemIds(req.user._id);
  const solvedIds = new Set(completedIds.map((id) => id.toString()));

  const problems = roadmap.problemIds.map((p) => ({
    ...p,
    solved: solvedIds.has(p._id.toString()),
  }));

  const solved = problems.filter((p) => p.solved).length;

  return ApiResponse.success(res, {
    ...roadmap,
    problemIds: problems,
    userProgress: {
      solved,
      total: problems.length,
      percentage: problems.length > 0 ? Math.round((solved / problems.length) * 100) : 0,
    },
  });
});

/**
 * POST /api/v1/roadmaps
 * Create a personal roadmap.
 */
const createPersonalRoadmap = asyncHandler(async (req, res) => {
  const { name, description, problemIds, tags } = req.body;

  if (!name || !name.trim()) {
    return ApiResponse.badRequest(res, 'Roadmap name is required.');
  }

  const roadmap = await Roadmap.create({
    name: name.trim(),
    description: description || '',
    isSystem: false,
    createdBy: req.user._id,
    problemIds: problemIds || [],
    tags: tags || [],
  });

  return ApiResponse.created(res, { roadmap });
});

/**
 * PATCH /api/v1/roadmaps/:id
 * Update a personal roadmap.
 */
const updatePersonalRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
    isSystem: false,
  });

  if (!roadmap) return ApiResponse.notFound(res, 'Personal roadmap not found.');

  const { name, description, problemIds, tags } = req.body;
  if (name) roadmap.name = name.trim();
  if (description !== undefined) roadmap.description = description;
  if (problemIds) roadmap.problemIds = problemIds;
  if (tags) roadmap.tags = tags;

  await roadmap.save();
  return ApiResponse.success(res, { roadmap }, 'Roadmap updated.');
});

/**
 * DELETE /api/v1/roadmaps/:id
 * Delete a personal roadmap.
 */
const deletePersonalRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findOneAndDelete({
    _id: req.params.id,
    createdBy: req.user._id,
    isSystem: false,
  });

  if (!roadmap) return ApiResponse.notFound(res, 'Personal roadmap not found.');
  return ApiResponse.success(res, null, 'Roadmap deleted.');
});

/**
 * POST /api/v1/roadmaps/admin
 * Create a system roadmap (admin only).
 */
const createSystemRoadmap = asyncHandler(async (req, res) => {
  const { name, description, problemIds, tags } = req.body;

  const roadmap = await Roadmap.create({
    name: name.trim(),
    description: description || '',
    isSystem: true,
    createdBy: req.user._id,
    problemIds: problemIds || [],
    tags: tags || [],
  });

  return ApiResponse.created(res, { roadmap });
});

/**
 * PATCH /api/v1/roadmaps/admin/:id
 */
const updateSystemRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findOne({ _id: req.params.id, isSystem: true });
  if (!roadmap) return ApiResponse.notFound(res, 'System roadmap not found.');

  const { name, description, problemIds, tags } = req.body;
  if (name) roadmap.name = name.trim();
  if (description !== undefined) roadmap.description = description;
  if (problemIds) roadmap.problemIds = problemIds;
  if (tags) roadmap.tags = tags;

  await roadmap.save();
  return ApiResponse.success(res, { roadmap }, 'System roadmap updated.');
});

/**
 * DELETE /api/v1/roadmaps/admin/:id
 */
const deleteSystemRoadmap = asyncHandler(async (req, res) => {
  const roadmap = await Roadmap.findOneAndDelete({ _id: req.params.id, isSystem: true });
  if (!roadmap) return ApiResponse.notFound(res, 'System roadmap not found.');
  return ApiResponse.success(res, null, 'System roadmap deleted.');
});

module.exports = {
  getAllRoadmaps,
  getSystemRoadmaps,
  getMyRoadmaps,
  getRoadmap,
  createPersonalRoadmap,
  updatePersonalRoadmap,
  deletePersonalRoadmap,
  createSystemRoadmap,
  updateSystemRoadmap,
  deleteSystemRoadmap,
};
