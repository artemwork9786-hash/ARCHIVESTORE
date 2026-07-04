import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiUrl, imgUrl } from '../config';
import LoadingOverlay from './LoadingOverlay';

export default function AdminModal({ isOpen, onClose, products, setProducts, onNotify }) {
  const { authHeader } = useAuth();
  const [screen, setScreen] = useState('list');
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const formRef = useRef(null);
  const galleryInputRef = useRef(null);

  if (!isOpen) return null;

  const nextArticle = products.length > 0
    ? `ARC-${String(Math.max(...products.map((p) => p.id)) + 1).padStart(3, '0')}`
    : 'ARC-001';

  const resetForm = () => {
    if (formRef.current) formRef.current.reset();
    setPreviewFile(null);
    setExistingImages([]);
    setNewFiles([]);
    setEditingProduct(null);
  };

  const switchToList = () => { resetForm(); setScreen('list'); };
  const switchToAdd = () => { resetForm(); setScreen('add'); };

  const switchToEdit = (product) => {
    setEditingProduct(product);
    setScreen('edit');
    setPreviewFile(null);
    setExistingImages((product.images || []).filter(Boolean).filter((img) => img !== product.preview));
    setNewFiles([]);
  };

  const handleAddGalleryFiles = (e) => {
    const files = Array.from(e.target.files);
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = '';
  };

  const handleRemoveExistingImage = async (imgPath) => {
    if (!editingProduct) return;
    try {
      const res = await fetch(apiUrl(`/api/products/${editingProduct.id}/images?path=${encodeURIComponent(imgPath)}`), {
        method: 'DELETE',
        headers: authHeader,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? updated : p)));
      setExistingImages((prev) => prev.filter((img) => img !== imgPath));
      onNotify('Картинка удалена', 'success');
    } catch (err) {
      console.error('Ошибка удаления картинки:', err);
      onNotify('Не удалось удалить картинку', 'error');
    }
  };

  const handleRemoveNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const buildFormData = (formEl) => {
    const fd = new FormData();
    const data = new FormData(formEl);
    for (const [key, val] of data.entries()) {
      if (key !== 'preview' && key !== 'gallery') fd.append(key, val);
    }
    if (previewFile) fd.append('preview', previewFile);
    newFiles.forEach((f) => fd.append('gallery', f));
    return fd;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fd = buildFormData(e.target);
    setLoading(true);

    try {
      const url = apiUrl(editingProduct ? `/api/products/${editingProduct.id}` : '/api/products');
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: authHeader, body: fd });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      if (editingProduct) {
        setProducts((prev) => prev.map((p) => (p.id === editingProduct.id ? result : p)));
        onNotify('Товар обновлён', 'success');
      } else {
        setProducts((prev) => [...prev, result]);
        onNotify('Товар успешно добавлен', 'success');
      }
      switchToList();
    } catch (err) {
      console.error('Ошибка:', err);
      onNotify(editingProduct ? 'Не удалось обновить товар' : 'Не удалось добавить товар', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/products/${id}`), { method: 'DELETE', headers: authHeader });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      onNotify('Товар удалён', 'success');
    } catch (err) {
      console.error('Ошибка удаления товара:', err);
      onNotify('Не удалось удалить товар', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => (price || 0).toLocaleString('ru-RU') + ' р.';
  const inputClass = "w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-none focus:outline-none focus:border-black dark:focus:border-white transition-colors placeholder-gray-300 dark:placeholder-neutral-600 font-mono text-sm";
  const labelClass = "font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1 block";

  const hasGallery = existingImages.length > 0 || newFiles.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-black w-full sm:max-w-lg sm:mx-4 max-h-[90vh] flex flex-col border-t sm:border border-gray-200 dark:border-white/10">
        <LoadingOverlay show={loading} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="font-mono text-base font-bold uppercase tracking-wider">
            {screen === 'edit' ? 'Редактирование' : screen === 'add' ? 'Добавить товар' : 'Список товаров'}
          </h2>
          <div className="flex items-center gap-2 shrink-0">
            {screen !== 'edit' ? (
              <>
                <button onClick={switchToAdd}
                  className={`h-9 min-w-[36px] px-2.5 flex items-center justify-center border transition-colors font-mono text-base font-bold ${screen === 'add' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                  title="Добавить товар">+</button>
                <button onClick={switchToList}
                  className={`h-9 min-w-[36px] px-2.5 flex items-center justify-center border transition-colors font-mono text-base ${screen === 'list' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' : 'border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                  title="Список товаров">≡</button>
                <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-0.5"></div>
              </>
            ) : (
              <button onClick={switchToList}
                className="shrink-0 items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors h-9 px-3 border border-gray-300 dark:border-white/20 inline-flex">
                <span className="text-lg leading-none -mt-px">←</span> Назад
              </button>
            )}
            <button onClick={onClose} className="h-9 w-9 flex items-center justify-center border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-lg">&times;</button>
          </div>
        </div>

        {(screen === 'add' || screen === 'edit') && (
          <div className="flex-1 min-h-[500px] overflow-y-auto">
            <form ref={formRef} onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
              <div>
                <label className={labelClass}>Название товара</label>
                <input type="text" name="name" required placeholder='"Archive" Hoodie' defaultValue={editingProduct?.name || ''} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Цена (руб.)</label>
                  <input type="number" name="price" required placeholder="4000" defaultValue={editingProduct?.price || ''} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Артикул</label>
                  <input type="text" name="article" readOnly placeholder="ARC-004"
                    defaultValue={editingProduct ? (editingProduct.specs?.['Артикул'] || '') : nextArticle}
                    className="w-full px-3 py-2.5 bg-gray-100 dark:bg-white/10 border border-gray-300 dark:border-white/10 rounded-none font-mono text-sm text-gray-500 dark:text-neutral-500 cursor-not-allowed" />
                </div>
              </div>

              {/* Превью */}
              <div>
                <label className={labelClass}>Превью</label>
                <div className="flex items-start gap-3">
                  <label className="group relative w-20 h-20 shrink-0 cursor-pointer overflow-hidden bg-gray-100 dark:bg-white/5">
                    {previewFile ? (
                      <img src={URL.createObjectURL(previewFile)} alt="" className="w-full h-full object-cover" />
                    ) : editingProduct?.preview ? (
                      <img src={imgUrl(editingProduct.preview)} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-neutral-500 text-xl">+</div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="font-mono text-[10px] text-white uppercase tracking-wider">Заменить</span>
                    </div>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        setPreviewFile(file || null);
                      }} />
                  </label>
                </div>
              </div>

              {/* Дополнительные фотки */}
              <div>
                <label className={labelClass}>Дополнительные фотки</label>
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((img) => (
                    <div key={img} className="group relative w-16 h-16 shrink-0 overflow-hidden bg-gray-100 dark:bg-white/5">
                      <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                      <button type="button" onClick={() => handleRemoveExistingImage(img)}
                        className="absolute top-0 right-0 w-5 h-5 bg-black/70 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        ✕
                      </button>
                    </div>
                  ))}
                  {newFiles.map((file, i) => (
                    <div key={`new-${i}`} className="group relative w-16 h-16 shrink-0 overflow-hidden bg-gray-100 dark:bg-white/5">
                      <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => handleRemoveNewFile(i)}
                        className="absolute top-0 right-0 w-5 h-5 bg-black/70 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => galleryInputRef.current?.click()}
                    className="w-16 h-16 shrink-0 flex items-center justify-center border border-dashed border-gray-300 dark:border-white/20 hover:border-black dark:hover:border-white transition-colors text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white text-xl">
                    +
                  </button>
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={handleAddGalleryFiles} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Описание</label>
                <textarea name="description" rows="3" placeholder="Описание товара..." defaultValue={editingProduct?.description || ''} className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-none focus:outline-none focus:border-black dark:focus:border-white transition-colors placeholder-gray-300 dark:placeholder-neutral-600 font-mono text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Состав</label>
                  <input type="text" name="composition" placeholder="100% хлопок" defaultValue={editingProduct?.specs?.['Состав'] || ''} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Страна</label>
                  <input type="text" name="country" placeholder="Турция" defaultValue={editingProduct?.specs?.['Страна'] || ''} className={inputClass} />
                </div>
              </div>
              <button type="submit"
                className="w-full py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-mono text-xs uppercase tracking-wider rounded-none font-bold">
                {editingProduct ? 'Сохранить изменения' : 'Добавить товар в каталог'}
              </button>
            </form>
          </div>
        )}

        {screen === 'list' && (
          <div className="flex-1 min-h-[500px] overflow-y-auto">
            {products.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-600">Каталог пуст</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3 gap-3">
                    <div className="w-10 h-10 shrink-0 overflow-hidden bg-gray-100 dark:bg-white/5">
                      <img src={imgUrl(p.preview)} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm uppercase tracking-wide truncate">{p.name}</p>
                      <p className="font-mono text-[10px] text-gray-400 dark:text-neutral-500 mt-0.5">
                        {(p.specs && p.specs['Артикул']) || ''} &middot; {formatPrice(p.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => switchToEdit(p)} className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm" title="Редактировать">✎</button>
                      <button onClick={() => handleDelete(p.id)} className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm" title="Удалить">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
