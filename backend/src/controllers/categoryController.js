const Category = require("../models/Category");
const { getPaginationParams, buildPaginationResponse } = require("../utils/pagination");

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip } = getPaginationParams(page, limit);

    const categories = await Category.find()
      .skip(skip)
      .limit(limit)
      .lean();

    const totalCount = await Category.countDocuments();

    const response = buildPaginationResponse(categories, totalCount, page, limit);

    res.json(response);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findById(categoryId).populate("parentCategory");

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ error: "Failed to fetch category" });
  }
};

// Create category (admin only)
const createCategory = async (req, res) => {
  try {
    const { name, description, parentCategory } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const category = new Category({
      name,
      description,
      parentCategory,
    });

    await category.save();

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

// Update category (admin only)
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, parentCategory } = req.body;

    const category = await Category.findByIdAndUpdate(
      categoryId,
      { name, description, parentCategory },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

// Delete category (admin only)
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await Category.findByIdAndDelete(categoryId);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
