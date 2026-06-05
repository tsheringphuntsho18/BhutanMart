import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerAPI, categoryAPI } from '../api/authAPI';
import toast from 'react-hot-toast';
import { Package, DollarSign, Tag, Upload, List, ArrowLeft, Plus, X } from 'lucide-react';
import '../styles/pages/AddProduct.css';

const EMPTY_VARIANT = { size: '', color: '', sku: '' };
const EMPTY_ATTR = { key: '', value: '' };

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [variants, setVariants] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    stock: '',
    imageUrl: '',
  });

  useEffect(() => {
    categoryAPI.getAllCategories()
      .then(res => setCategories(res.data?.data || []))
      .catch(() => setCategories([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);
    try {
      const res = await sellerAPI.uploadImage(file);
      setForm(prev => ({ ...prev, imageUrl: res.data.url }));
      toast.success('Image uploaded');
    } catch {
      toast.error('Image upload failed');
      setImagePreview(null);
    } finally {
      setImageUploading(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (t) => setTags(prev => prev.filter(x => x !== t));

  const addVariant = () => setVariants(prev => [...prev, { ...EMPTY_VARIANT }]);

  const updateVariant = (i, field, value) =>
    setVariants(prev => prev.map((v, idx) => idx === i ? { ...v, [field]: value } : v));

  const removeVariant = (i) => setVariants(prev => prev.filter((_, idx) => idx !== i));

  const addAttribute = () => setAttributes(prev => [...prev, { ...EMPTY_ATTR }]);
  const updateAttribute = (i, field, value) =>
    setAttributes(prev => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  const removeAttribute = (i) => setAttributes(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId) {
      toast.error('Please select a category');
      return;
    }
    setLoading(true);
    try {
      // Convert attributes array → object { key: value }
      const attributesObj = attributes
        .filter(a => a.key.trim())
        .reduce((obj, a) => ({ ...obj, [a.key.trim()]: a.value.trim() }), {});

      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        tags,
        variants: variants.filter(v => v.size || v.color || v.sku),
        attributes: attributesObj,
      };
      await sellerAPI.createProduct(payload);
      toast.success('Product added successfully!');
      navigate('/dashboard/seller');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-product-page">
      <div className="add-product-container">
        <div className="add-product-header">
          <button className="btn-back" onClick={() => navigate('/dashboard/seller')}>
            <ArrowLeft size={18} /> Back to Dashboard
          </button>
          <h1><Package size={26} /> Add New Product</h1>
          <p>Fill in the details below to list a new product</p>
        </div>

        <form onSubmit={handleSubmit} className="add-product-form">

          {/* Basic Info */}
          <section className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label>Product Name <span className="required">*</span></label>
              <div className="input-wrapper">
                <Package size={16} />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Traditional Bhutanese Kira"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your product..."
                rows={4}
                className="textarea-input"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category <span className="required">*</span></label>
                <select
                  name="categoryId"
                  value={form.categoryId}
                  onChange={handleChange}
                  className="select-input"
                  required
                >
                  <option value="">Select category</option>
                  {categories.length === 0 && (
                    <option disabled>No categories available</option>
                  )}
                  {/* Parent categories as optgroups, children indented */}
                  {categories.filter(c => !c.parentCategory).map(parent => (
                    <optgroup key={parent._id} label={parent.name}>
                      <option value={parent._id}>{parent.name}</option>
                      {categories
                        .filter(c => c.parentCategory === parent._id || c.parentCategory?._id === parent._id)
                        .map(child => (
                          <option key={child._id} value={child._id}>— {child.name}</option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Price (Nu.) <span className="required">*</span></label>
                <div className="input-wrapper">
                  <DollarSign size={16} />
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Stock Quantity</label>
                <div className="input-wrapper">
                  <List size={16} />
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Product Image</label>
              <label className={`upload-zone ${imagePreview ? 'has-image' : ''}`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="upload-preview" />
                ) : (
                  <div className="upload-placeholder">
                    <Upload size={32} />
                    <span>Click to upload image</span>
                    <span className="upload-hint">JPG, PNG, WEBP up to 5 MB</span>
                  </div>
                )}
                {imageUploading && <div className="upload-overlay">Uploading...</div>}
              </label>
              {imagePreview && (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: 8, alignSelf: 'flex-start' }}
                  onClick={() => { setImagePreview(null); setForm(p => ({ ...p, imageUrl: '' })); }}
                >
                  <X size={14} /> Remove image
                </button>
              )}
            </div>
          </section>

          {/* Tags */}
          <section className="form-section">
            <h2><Tag size={18} /> Tags</h2>
            <div className="tag-input-row">
              <div className="input-wrapper">
                <Tag size={16} />
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Type a tag and press Enter"
                />
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={addTag}>
                <Plus size={14} /> Add
              </button>
            </div>
            {tags.length > 0 && (
              <div className="tags-list">
                {tags.map(t => (
                  <span key={t} className="tag-chip">
                    {t}
                    <button type="button" onClick={() => removeTag(t)}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Custom Attributes */}
          <section className="form-section">
            <div className="section-header">
              <h2>Custom Attributes <span className="optional">(optional)</span></h2>
              <button type="button" className="btn btn-outline btn-sm" onClick={addAttribute}>
                <Plus size={14} /> Add Attribute
              </button>
            </div>
            <p className="empty-hint" style={{ marginBottom: 8 }}>
              Add category-specific details, e.g. RAM → 16GB, Fabric → Cotton, Brand → Samsung
            </p>
            {attributes.length > 0 && (
              <div className="variants-list">
                {attributes.map((a, i) => (
                  <div key={i} className="variant-row">
                    <input
                      type="text"
                      placeholder="Attribute (e.g. RAM, Fabric)"
                      value={a.key}
                      onChange={e => updateAttribute(i, 'key', e.target.value)}
                      className="variant-input"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 16GB, Cotton)"
                      value={a.value}
                      onChange={e => updateAttribute(i, 'value', e.target.value)}
                      className="variant-input"
                    />
                    <button type="button" className="btn-remove" onClick={() => removeAttribute(i)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Variants */}
          <section className="form-section">
            <div className="section-header">
              <h2>Variants <span className="optional">(optional)</span></h2>
              <button type="button" className="btn btn-outline btn-sm" onClick={addVariant}>
                <Plus size={14} /> Add Variant
              </button>
            </div>
            {variants.length === 0 ? (
              <p className="empty-hint">No variants added. Use variants for different sizes or colors.</p>
            ) : (
              <div className="variants-list">
                {variants.map((v, i) => (
                  <div key={i} className="variant-row">
                    <input
                      type="text"
                      placeholder="Size"
                      value={v.size}
                      onChange={e => updateVariant(i, 'size', e.target.value)}
                      className="variant-input"
                    />
                    <input
                      type="text"
                      placeholder="Color"
                      value={v.color}
                      onChange={e => updateVariant(i, 'color', e.target.value)}
                      className="variant-input"
                    />
                    <input
                      type="text"
                      placeholder="SKU"
                      value={v.sku}
                      onChange={e => updateVariant(i, 'sku', e.target.value)}
                      className="variant-input"
                    />
                    <button type="button" className="btn-remove" onClick={() => removeVariant(i)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard/seller')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Adding Product...' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
