const API_PRODUCT = 'https://localhost:7036/api/products';
const API_CATEGORY = 'https://localhost:7036/api/Categories';

let currentProductId = null;
let currentCategoryId = null;

// Biến cục bộ để lưu trữ danh mục giúp tối ưu việc tìm kiếm tên danh mục
let localCategories = [];

document.addEventListener('DOMContentLoaded', () => {
    // Tải dữ liệu ban đầu
    loadInitialData();

    // --- SỰ KIỆN SẢN PHẨM ---
    document.getElementById('btnAddProduct').addEventListener('click', addProduct);
    document.getElementById('btnUpdateProduct').addEventListener('click', updateProduct);
    document.getElementById('btnResetProduct').addEventListener('click', clearProductForm);
    document.getElementById('productList').addEventListener('click', handleProductActions);

    // --- SỰ KIỆN DANH MỤC ---
    document.getElementById('btnAddCategory').addEventListener('click', addCategory);
    document.getElementById('btnUpdateCategory').addEventListener('click', updateCategory);
    document.getElementById('btnResetCategory').addEventListener('click', clearCategoryForm);
    document.getElementById('categoryList').addEventListener('click', handleCategoryActions);
});

// Hàm hỗ trợ đồng bộ tải danh mục trước, sản phẩm sau để tránh lỗi hiển thị danh mục
async function loadInitialData() {
    await fetchCategories();
    fetchProducts();
}

// =========================================================================
// XỬ LÝ LOGIC DANH MỤC (CATEGORY)
// =========================================================================

async function fetchCategories() {
    try {
        const res = await fetch(API_CATEGORY);
        const data = await res.json();
        localCategories = data; // Lưu lại danh sách để dùng bên Product

        // 1. Render danh sách vào bảng Quản lý danh mục
        const tbody = document.getElementById('categoryList');
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">Không có danh mục nào</td></tr>`;
        } else {
            data.forEach(cat => {
                tbody.innerHTML += `
                    <tr>
                        <td>${cat.id}</td>
                        <td class="fw-bold text-primary">${cat.name}</td>
                        <td>${cat.description || '<span class="text-muted">Không có mô tả</span>'}</td>
                        <td class="text-end">
                            <button class="btn btn-primary btn-sm view-cat-btn" data-id="${cat.id}"><i class="fa-solid fa-eye"></i> View</button>
                            <button class="btn btn-warning btn-sm edit-cat-btn text-white mx-1" data-id="${cat.id}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                            <button class="btn btn-danger btn-sm delete-cat-btn" data-id="${cat.id}"><i class="fa-solid fa-trash"></i> Delete</button>
                        </td>
                    </tr>`;
            });
        }

        // 2. Cập nhật dữ liệu vào dropdown select bên form Sản phẩm
        const selectElement = document.getElementById('productCategoryId');
        if (selectElement) {
            let options = '<option value="" selected disabled>-- Chọn danh mục thời trang --</option>';
            data.forEach(cat => {
                options += `<option value="${cat.id}">${cat.name}</option>`;
            });
            selectElement.innerHTML = options;
        }
    } catch (err) {
        console.error("Lỗi khi tải danh mục:", err);
    }
}

function addCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();

    if (!name) {
        Swal.fire('Chú ý!', 'Vui lòng nhập tên danh mục!', 'warning');
        return;
    }

    fetch(API_CATEGORY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
    }).then(res => {
        if(res.ok) {
            Swal.fire('Thành công', 'Đã thêm danh mục mới', 'success');
            clearCategoryForm();
            loadInitialData(); // Tải lại cả 2 bên để cập nhật dropdown select
        }
    });
}

function handleCategoryActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');

    if (btn.classList.contains('view-cat-btn')) {
        fetch(`${API_CATEGORY}/${id}`).then(res => res.json()).then(cat => {
            document.getElementById('modalTitle').innerText = "Chi tiết danh mục";
            document.getElementById('modalBodyDetails').innerHTML = `
                <p><b>Mã danh mục:</b> ${cat.id}</p>
                <p><b>Tên danh mục:</b> ${cat.name}</p>
                <p><b>Mô tả:</b> ${cat.description || 'Không có mô tả'}</p>
            `;
            new bootstrap.Modal(document.getElementById('modalViewDetailInfo')).show();
        });
    } 
    else if (btn.classList.contains('edit-cat-btn')) {
        fetch(`${API_CATEGORY}/${id}`).then(res => res.json()).then(cat => {
            document.getElementById('categoryName').value = cat.name;
            document.getElementById('categoryDescription').value = cat.description || '';
            currentCategoryId = cat.id;
            document.getElementById('btnAddCategory').style.display = 'none';
            document.getElementById('btnUpdateCategory').style.display = 'inline-block';
        });
    } 
    else if (btn.classList.contains('delete-cat-btn')) {
        Swal.fire({
            title: 'Bạn chắc chắn muốn xóa?',
            text: "Dữ liệu danh mục sẽ bị xóa vĩnh viễn!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Xóa ngay'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`${API_CATEGORY}/${id}`, { method: 'DELETE' }).then(() => {
                    Swal.fire('Đã xóa!', 'Danh mục đã loại bỏ.', 'success');
                    loadInitialData();
                });
            }
        });
    }
}

function updateCategory() {
    const name = document.getElementById('categoryName').value.trim();
    const description = document.getElementById('categoryDescription').value.trim();

    fetch(`${API_CATEGORY}/${currentCategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentCategoryId, name, description })
    }).then(() => {
        Swal.fire('Thành công', 'Đã cập nhật danh mục!', 'success');
        clearCategoryForm();
        loadInitialData();
    });
}

function clearCategoryForm() {
    document.getElementById('categoryName').value = '';
    document.getElementById('categoryDescription').value = '';
    currentCategoryId = null;
    document.getElementById('btnAddCategory').style.display = 'inline-block';
    document.getElementById('btnUpdateCategory').style.display = 'none';
}

// =========================================================================
// XỬ LÝ LOGIC SẢN PHẨM (PRODUCT)
// =========================================================================
function fetchProducts() {
    fetch(API_PRODUCT).then(res => res.json()).then(data => {
        const tbody = document.getElementById('productList');
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">Danh sách trống</td></tr>`;
            return;
        }
        data.forEach(prod => {
            // Tìm tên danh mục dựa vào categoryId có sẵn trong product
            let categoryName = '<span class="text-muted">Chưa phân loại</span>';
            if (prod.category && prod.category.name) {
                categoryName = prod.category.name;
            } else if (prod.categoryId) {
                const foundCat = localCategories.find(c => c.id === prod.categoryId);
                if (foundCat) categoryName = foundCat.name;
            }

            tbody.innerHTML += `
                <tr>
                    <td>${prod.id}</td>
                    <td class="fw-bold">${prod.name}</td>
                    <td><span class="badge bg-info text-dark">${categoryName}</span></td>
                    <td class="text-success">${Number(prod.price).toLocaleString('vi-VN')} đ</td>
                    <td>${prod.description || ''}</td>
                    <td class="text-end">
                        <button class="btn btn-primary btn-sm view-prod-btn" data-id="${prod.id}"><i class="fa-solid fa-eye"></i> View</button>
                        <button class="btn btn-warning btn-sm edit-prod-btn text-white mx-1" data-id="${prod.id}"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                        <button class="btn btn-danger btn-sm delete-prod-btn" data-id="${prod.id}"><i class="fa-solid fa-trash"></i> Delete</button>
                    </td>
                </tr>`;
        });
    });
}

function addProduct() {
    const name = document.getElementById('bookName').value.trim();
    const price = parseFloat(document.getElementById('price').value) || 0;
    const description = document.getElementById('description').value.trim();
    const categorySelect = document.getElementById('productCategoryId');
    const categoryId = categorySelect && categorySelect.value ? parseInt(categorySelect.value) : null;

    if(!name || price <= 0) {
        Swal.fire('Thông báo', 'Vui lòng điền đúng thông tin sản phẩm', 'warning');
        return;
    }

    if (!categoryId) {
        Swal.fire('Thông báo', 'Vui lòng chọn danh mục cho trang phục này', 'warning');
        return;
    }

    fetch(API_PRODUCT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, description, categoryId })
    }).then(() => { 
        Swal.fire('Thành công', 'Đã thêm sản phẩm', 'success'); 
        clearProductForm(); 
        fetchProducts(); 
    });
}

function handleProductActions(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');

    if (btn.classList.contains('view-prod-btn')) {
        fetch(`${API_PRODUCT}/${id}`).then(res => res.json()).then(prod => {
            let categoryName = 'Chưa phân loại';
            if (prod.category && prod.category.name) {
                categoryName = prod.category.name;
            } else if (prod.categoryId) {
                const foundCat = localCategories.find(c => c.id === prod.categoryId);
                if (foundCat) categoryName = foundCat.name;
            }

            document.getElementById('modalTitle').innerText = "Chi tiết sản phẩm";
            document.getElementById('modalBodyDetails').innerHTML = `
                <p><b>Mã sản phẩm:</b> ${prod.id}</p>
                <p><b>Tên sản phẩm:</b> ${prod.name}</p>
                <p><b>Danh mục:</b> <span class="badge bg-info text-dark">${categoryName}</span></p>
                <p><b>Giá:</b> <span class="text-success">${Number(prod.price).toLocaleString('vi-VN')} đ</span></p>
                <p><b>Mô tả:</b> ${prod.description || 'Không có mô tả'}</p>
            `;
            new bootstrap.Modal(document.getElementById('modalViewDetailInfo')).show();
        });
    } else if (btn.classList.contains('edit-prod-btn')) {
        fetch(`${API_PRODUCT}/${id}`).then(res => res.json()).then(prod => {
            document.getElementById('bookName').value = prod.name;
            document.getElementById('price').value = prod.price;
            document.getElementById('description').value = prod.description || '';
            
            const categorySelect = document.getElementById('productCategoryId');
            if (categorySelect) {
                categorySelect.value = prod.categoryId || '';
            }

            currentProductId = prod.id;
            document.getElementById('btnAddProduct').style.display = 'none';
            document.getElementById('btnUpdateProduct').style.display = 'inline-block';
        });
    } else if (btn.classList.contains('delete-prod-btn')) {
        Swal.fire({
            title: 'Xóa sản phẩm này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xóa'
        }).then(result => {
            if (result.isConfirmed) {
                fetch(`${API_PRODUCT}/${id}`, { method: 'DELETE' }).then(() => { fetchProducts(); Swal.fire('Đã xóa', '', 'success'); });
            }
        });
    }
}

function updateProduct() {
    const name = document.getElementById('bookName').value.trim();
    const price = parseFloat(document.getElementById('price').value) || 0;
    const description = document.getElementById('description').value.trim();
    const categorySelect = document.getElementById('productCategoryId');
    const categoryId = categorySelect && categorySelect.value ? parseInt(categorySelect.value) : null;

    if (!categoryId) {
        Swal.fire('Thông báo', 'Vui lòng chọn danh mục cho sản phẩm', 'warning');
        return;
    }

    fetch(`${API_PRODUCT}/${currentProductId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentProductId, name, price, description, categoryId })
    }).then(() => { 
        Swal.fire('Thành công', 'Đã cập nhật', 'success'); 
        clearProductForm(); 
        fetchProducts(); 
    });
}

// Làm mới form sản phẩm và reset select box về trạng thái mặc định
function clearProductForm() {
    document.getElementById('bookName').value = '';
    document.getElementById('price').value = '';
    document.getElementById('description').value = '';
    const categorySelect = document.getElementById('productCategoryId');
    if (categorySelect) {
        categorySelect.value = '';
    }
    currentProductId = null;
    document.getElementById('btnAddProduct').style.display = 'inline-block';
    document.getElementById('btnUpdateProduct').style.display = 'none';
}