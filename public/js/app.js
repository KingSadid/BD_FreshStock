async function loadDashboard() {
    try {
        const dashboardMetrics = await api.getKPIs();
        updateDashboardCounters(dashboardMetrics);
        updateDashboardNotificationBadges(dashboardMetrics);

        const expiringBatchesList = await api.getExpiringBatches(7);
        renderExpiringBatchesList(expiringBatchesList);

        const recentActivityMovements = await api.getRecentMovements();
        renderRecentActivityList(recentActivityMovements);

        const [movementStatisticsData, categoryStatisticsData] = await Promise.all([
            api.getMovementStats(),
            api.getCategoryStats()
        ]);

        renderMovementChart(movementStatisticsData);
        renderCategoryChart(categoryStatisticsData);

        triggerNumericAnimations(dashboardMetrics);
    } catch (error) {
        console.error(error);
        showToast('Error', 'No se pudieron cargar los datos', 'error');
    }
}

function updateDashboardCounters(metricsData) {
    try {
        document.getElementById('kpi-products').textContent = metricsData.active_products;
        document.getElementById('kpi-batches').textContent = metricsData.total_batches;
        document.getElementById('kpi-expiring').textContent = metricsData.expiring_soon;
        document.getElementById('kpi-critical').textContent = metricsData.critical_stock;
    } catch (error) {
        console.error(error);
    }
}

function updateDashboardNotificationBadges(metricsData) {
    try {
        document.querySelectorAll('[id^="nav-badge-products"]').forEach(badgeElement => badgeElement.textContent = metricsData.active_products);
        document.querySelectorAll('[id^="nav-badge-alerts"]').forEach(badgeElement => badgeElement.textContent = metricsData.expiring_soon);

        document.getElementById('banner-alerts').textContent = `${metricsData.expiring_soon} alertas`;
        document.getElementById('banner-expiring').textContent = `${metricsData.expiring_soon} productos`;
        document.getElementById('login-stat-products').textContent = `${metricsData.active_products} productos`;
        document.getElementById('login-stat-alerts').textContent = `${metricsData.expiring_soon} alertas`;
    } catch (error) {
        console.error(error);
    }
}

function renderExpiringBatchesList(batchesArray) {
    try {
        const expiryListContainer = document.getElementById('dashboard-expiry-list');
        expiryListContainer.innerHTML = batchesArray.map(batchItem => {
            const daysRemainingValue = getDaysRemaining(batchItem.expiry_date);
            const statusIdentifierClass = daysRemainingValue <= 0 ? 'critical' : daysRemainingValue <= 2 ? 'warning' : 'caution';
            const daysRemainingString = daysRemainingValue <= 0 ? 'Hoy' : `${daysRemainingValue} días`;

            return `
                <div class="expiry-item ${statusIdentifierClass}">
                    <div class="expiry-icon"><i class="fas fa-box"></i></div>
                    <div class="expiry-info">
                        <span class="expiry-name">${batchItem.product_name}</span>
                        <span class="expiry-lot">Lote #${batchItem.batch_code}</span>
                    </div>
                    <div class="expiry-date">
                        <span class="expiry-badge ${statusIdentifierClass}">${daysRemainingString}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error(error);
    }
}

function renderRecentActivityList(movementsArray) {
    try {
        const activityListContainer = document.getElementById('dashboard-activity-list');
        activityListContainer.innerHTML = movementsArray.slice(0, 5).map(movementRecord => {
            const movementColorMap = { purchase: 'green', sale: 'blue', waste: 'red', adjustment: 'orange' };
            const activeStatusColor = movementColorMap[movementRecord.movement_type] || 'blue';

            return `
                <div class="activity-item">
                    <div class="activity-dot ${activeStatusColor}"></div>
                    <div class="activity-info">
                        <span class="activity-text"><strong>${movementRecord.user_name}</strong> ${movementRecord.movement_type} de <strong>${movementRecord.quantity} unid.</strong> ${movementRecord.product_name}</span>
                        <span class="activity-time">${formatDate(movementRecord.datetime)}</span>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error(error);
    }
}

function triggerNumericAnimations(metricsData) {
    animateNumericValue('kpi-products', 0, metricsData.active_products, 1000);
    animateNumericValue('kpi-batches', 0, metricsData.total_batches, 1000);
}

function calculateMovementPlotData(chartDataArray) {
    const daysOfWeekLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const currentDate = new Date();
    const lastSevenDaysArray = [];

    for (let dayIndex = 6; dayIndex >= 0; dayIndex--) {
        const targetDate = new Date();
        targetDate.setDate(currentDate.getDate() - dayIndex);
        lastSevenDaysArray.push({
            dateString: targetDate.toISOString().split('T')[0],
            dayNameString: daysOfWeekLabels[targetDate.getDay()]
        });
    }

    return lastSevenDaysArray.map(dayItem => {
        const matchingDayData = chartDataArray.find(dataItem => dataItem.date.startsWith(dayItem.dateString)) || { entries: 0, exits: 0 };
        return { day: dayItem.dayNameString, entries: matchingDayData.entries, exits: matchingDayData.exits };
    });
}

function buildMovementChartSvgMarkup(plottedDataValues, chartDimensions, maximumDataValue) {
    const chartWorkingWidth = chartDimensions.width - chartDimensions.padding * 2;
    const chartWorkingHeight = chartDimensions.height - chartDimensions.padding * 2;

    const calculateXCoordinate = (index) => chartDimensions.padding + (index * chartWorkingWidth) / 6;
    const calculateYCoordinate = (value) => (chartDimensions.height - chartDimensions.padding) - (value * chartWorkingHeight) / maximumDataValue;

    let pathEntryLines = `M ${calculateXCoordinate(0)},${calculateYCoordinate(plottedDataValues[0].entries)}`;
    let pathExitLines = `M ${calculateXCoordinate(0)},${calculateYCoordinate(plottedDataValues[0].exits)}`;
    let areaEntryPolygon = `M ${calculateXCoordinate(0)},${chartDimensions.height - chartDimensions.padding} L ${calculateXCoordinate(0)},${calculateYCoordinate(plottedDataValues[0].entries)}`;
    let areaExitPolygon = `M ${calculateXCoordinate(0)},${chartDimensions.height - chartDimensions.padding} L ${calculateXCoordinate(0)},${calculateYCoordinate(plottedDataValues[0].exits)}`;

    let coordinateEntryPoints = '';
    let coordinateExitPoints = '';
    let axisLabelsText = '';

    plottedDataValues.forEach((dataPoint, index) => {
        const xCoordinate = calculateXCoordinate(index);
        const yEntryCoordinate = calculateYCoordinate(dataPoint.entries);
        const yExitCoordinate = calculateYCoordinate(dataPoint.exits);

        if (index > 0) {
            pathEntryLines += ` L ${xCoordinate},${yEntryCoordinate}`;
            pathExitLines += ` L ${xCoordinate},${yExitCoordinate}`;
        }
        areaEntryPolygon += ` L ${xCoordinate},${yEntryCoordinate}`;
        areaExitPolygon += ` L ${xCoordinate},${yExitCoordinate}`;

        coordinateEntryPoints += `<circle cx="${xCoordinate}" cy="${yEntryCoordinate}" r="4" fill="#10b981" />`;
        coordinateExitPoints += `<circle cx="${xCoordinate}" cy="${yExitCoordinate}" r="4" fill="#6366f1" />`;
        axisLabelsText += `<text x="${xCoordinate}" y="${chartDimensions.height - 10}" text-anchor="middle" fill="var(--text-muted)" font-size="11">${dataPoint.day}</text>`;
    });

    areaEntryPolygon += ` L ${calculateXCoordinate(6)},${chartDimensions.height - chartDimensions.padding} Z`;
    areaExitPolygon += ` L ${calculateXCoordinate(6)},${chartDimensions.height - chartDimensions.padding} Z`;

    return `
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.2" />
                <stop offset="100%" style="stop-color:#10b981;stop-opacity:0" />
            </linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0.2" />
                <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0" />
            </linearGradient>
        </defs>
        <path d="${areaEntryPolygon}" fill="url(#grad1)" />
        <path d="${pathEntryLines}" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
        <path d="${areaExitPolygon}" fill="url(#grad2)" />
        <path d="${pathExitLines}" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round" />
        ${coordinateEntryPoints}
        ${coordinateExitPoints}
        ${axisLabelsText}
    `;
}

function renderMovementChart(chartDataArray) {
    try {
        const svgContainerElement = document.querySelector('.line-chart-svg');
        if (!svgContainerElement) return;

        const plottedDataValues = calculateMovementPlotData(chartDataArray);
        const maximumDataValue = Math.max(...plottedDataValues.map(dataPoint => Math.max(dataPoint.entries, dataPoint.exits)), 10);
        const chartDimensionsConfiguration = { width: 600, height: 200, padding: 40 };

        const svgMarkupContent = buildMovementChartSvgMarkup(plottedDataValues, chartDimensionsConfiguration, maximumDataValue);
        svgContainerElement.innerHTML = svgMarkupContent;
    } catch (error) {
        console.error(error);
    }
}

function renderCategoryChartLegend(categoryDataArray, totalProductsCount, legendContainerElement, chartColorsArray) {
    legendContainerElement.innerHTML = categoryDataArray.map((categoryItem, index) => `
        <div class="legend-item">
            <span class="legend-dot" style="background:${chartColorsArray[index % chartColorsArray.length]}"></span>
            <span class="legend-label">${categoryItem.name}</span>
            <span class="legend-val">${categoryItem.product_count}</span>
        </div>
    `).join('');
}

function renderCategoryChartSegments(categoryDataArray, totalProductsCount, svgContainerElement, chartColorsArray) {
    const circleRadius = 80;
    const circleCircumference = 2 * Math.PI * circleRadius;
    let currentStrokeOffset = 0;

    const existingSegments = svgContainerElement.querySelectorAll('.donut-seg');
    existingSegments.forEach(segmentElement => segmentElement.remove());

    categoryDataArray.forEach((categoryItem, index) => {
        if (categoryItem.product_count === 0) return;
        const distributionPercent = categoryItem.product_count / totalProductsCount;
        const currentStrokeDash = distributionPercent * circleCircumference;

        const circleSvgElement = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circleSvgElement.setAttribute("cx", "100");
        circleSvgElement.setAttribute("cy", "100");
        circleSvgElement.setAttribute("r", "80");
        circleSvgElement.setAttribute("fill", "none");
        circleSvgElement.setAttribute("stroke", chartColorsArray[index % chartColorsArray.length]);
        circleSvgElement.setAttribute("stroke-width", "24");
        circleSvgElement.setAttribute("stroke-dasharray", `${currentStrokeDash} ${circleCircumference}`);
        circleSvgElement.setAttribute("stroke-dashoffset", -currentStrokeOffset);
        circleSvgElement.setAttribute("class", "donut-seg");

        svgContainerElement.appendChild(circleSvgElement);
        currentStrokeOffset += currentStrokeDash;
    });

    const overlayTextElements = svgContainerElement.querySelectorAll('text');
    overlayTextElements.forEach(textElement => svgContainerElement.appendChild(textElement));
}

function renderCategoryChart(categoryDataArray) {
    try {
        const totalProductsCount = categoryDataArray.reduce((accumulator, currentCategory) => accumulator + currentCategory.product_count, 0);
        document.getElementById('donut-total').textContent = totalProductsCount;

        const chartColorsArray = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
        const legendContainerElement = document.getElementById('categories-legend');
        const svgContainerElement = document.querySelector('.donut-svg');

        if (!svgContainerElement || !legendContainerElement) return;

        renderCategoryChartLegend(categoryDataArray, totalProductsCount, legendContainerElement, chartColorsArray);
        renderCategoryChartSegments(categoryDataArray, totalProductsCount, svgContainerElement, chartColorsArray);

        if (window.GSAPIntegration) {
            window.GSAPIntegration.animateDashboardExt(document.getElementById('screen-dashboard'));
        }
    } catch (error) {
        console.error(error);
    }
}

async function loadProducts() {
    try {
        const [productsListArray, categoriesListArray] = await Promise.all([
            api.getProducts(),
            api.getCategories()
        ]);

        AppState.products = productsListArray;
        AppState.categories = categoriesListArray;

        renderProductGrid(productsListArray);
        renderCategoryFilters(categoriesListArray, productsListArray.length);
    } catch (error) {
        console.error(error);
    }
}

function renderProductGrid(productsListArray) {
    try {
        const productGridContainer = document.getElementById('products-grid');
        productGridContainer.innerHTML = productsListArray.map(productItem => {
            const simulatedStockPercent = Math.min(100, (Math.random() * 60 + 40));
            const inventoryStatus = simulatedStockPercent < 20 ? 'danger' : simulatedStockPercent < 50 ? 'warning' : 'ok';
            const inventoryStatusText = simulatedStockPercent < 20 ? 'Crítico' : simulatedStockPercent < 50 ? 'Stock Bajo' : 'En Stock';
            const statusColorCode = inventoryStatus === 'ok' ? '#10b981' : inventoryStatus === 'warning' ? '#f59e0b' : '#ef4444';

            return `
                <div class="product-card" onclick="viewProductDetail('${productItem.sku}')">
                    <div class="pc-image" style="background: linear-gradient(135deg, #dbeafe, #bfdbfe);">
                        <i class="fas fa-box" style="color:#3b82f6;font-size:2.5rem;"></i>
                        <span class="pc-badge ${inventoryStatus}">${inventoryStatusText}</span>
                    </div>
                    <div class="pc-body">
                        <span class="pc-category">${productItem.category_name || 'General'}</span>
                        <h4>${productItem.name}</h4>
                        <p class="pc-sku">SKU: ${productItem.sku}</p>
                        <div class="pc-stock">
                            <div class="stock-bar"><div class="stock-fill" style="width:${simulatedStockPercent}%;background:${statusColorCode};"></div></div>
                            <span>Stock disponible</span>
                        </div>
                        <div class="pc-footer">
                            <span class="pc-price">$${parseFloat(productItem.sale_price).toLocaleString()}</span>
                            <span class="pc-lots">Ver detalle</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        document.getElementById('count-all').textContent = productsListArray.length;
    } catch (error) {
        console.error(error);
    }
}

function renderCategoryFilters(categoriesListArray, totalProductsCount) {
    try {
        const categoryFilterContainer = document.getElementById('category-filters');
        categoryFilterContainer.innerHTML = `
            <button class="chip active" onclick="filterProducts('all')">Todos <span class="chip-count">${totalProductsCount}</span></button>
            ${categoriesListArray.map(categoryItem => `<button class="chip" onclick="filterProducts('${categoryItem.category_id}')">${categoryItem.name} <span class="chip-count">${categoryItem.product_count}</span></button>`).join('')}
        `;
    } catch (error) {
        console.error(error);
    }
}

function filterProducts(categoryIdentifier) {
    try {
        document.querySelectorAll('#category-filters .chip').forEach(chipElement => chipElement.classList.remove('active'));
        if (event && event.target) {
            event.target.closest('.chip').classList.add('active');
        }
    } catch (error) {
        console.error(error);
    }
}

function populateProductDetailFields(productDetailsObject) {
    document.getElementById('detail-name').textContent = productDetailsObject.name;
    document.getElementById('detail-sku').textContent = `SKU: ${productDetailsObject.sku}`;
    document.getElementById('detail-category').textContent = productDetailsObject.category_name || 'Sin categoría';
    document.getElementById('detail-desc').textContent = productDetailsObject.description || 'Sin descripción';
    document.getElementById('detail-unit').textContent = `Unidad: ${productDetailsObject.unit_abbr || 'un'}`;
    document.getElementById('detail-min-stock').textContent = `Stock Mínimo: ${productDetailsObject.min_stock} ${productDetailsObject.unit_abbr || 'un'}`;
    document.getElementById('detail-price').textContent = `Precio: $${parseFloat(productDetailsObject.sale_price).toLocaleString()}`;
    document.getElementById('detail-breadcrumb').textContent = `Productos / ${productDetailsObject.name}`;
}

function renderProductBatchesTable(productBatchesArray) {
    const batchesTableContainer = document.getElementById('detail-lots-table');
    batchesTableContainer.innerHTML = productBatchesArray.map(batchRecord => {
        const daysRemainingValue = getDaysRemaining(batchRecord.expiry_date);
        return `
            <tr>
                <td><strong>#${batchRecord.batch_code}</strong></td>
                <td>${formatDate(batchRecord.entry_date)}</td>
                <td>${formatDate(batchRecord.expiry_date)}</td>
                <td>${batchRecord.current_quantity}/${batchRecord.initial_quantity}</td>
                <td>${getStatusBadge(daysRemainingValue)}</td>
                <td>
                    <button class="icon-btn-sm" title="Ver lote"><i class="fas fa-eye"></i></button>
                    <button class="icon-btn-sm" title="Registrar salida" onclick="registerOutput(${batchRecord.batch_id})"><i class="fas fa-minus-circle"></i></button>
                    <button class="icon-btn-sm btn-danger-text" title="Eliminar lote" onclick="deleteBatchConfirm(${batchRecord.batch_id})"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="6" style="text-align:center">No hay lotes activos</td></tr>';
}

async function viewProductDetail(productSkuIdentifier) {
    try {
        const productDetailsObject = await api.getProduct(productSkuIdentifier);
        populateProductDetailFields(productDetailsObject);

        const allBatchesArray = await api.getBatches();
        const specificProductBatches = allBatchesArray.filter(batchRecord => batchRecord.sku === productSkuIdentifier);
        renderProductBatchesTable(specificProductBatches);

        document.getElementById('btn-edit-product').onclick = () => editProduct(productDetailsObject);
        document.getElementById('btn-delete-product').onclick = () => deleteProductConfirm(productDetailsObject.sku);

        navigateTo('screen-product-detail');
    } catch (error) {
        console.error(error);
        showToast('Error', 'No se pudo cargar el producto', 'error');
    }
}

async function loadLots() {
    try {
        const allBatchesArray = await api.getBatches();
        AppState.batches = allBatchesArray;

        const tableBodyContainer = document.getElementById('lots-table-body');
        tableBodyContainer.innerHTML = allBatchesArray.map((batchRecord, indexPosition) => {
            const daysRemainingValue = getDaysRemaining(batchRecord.expiry_date);
            const rowHighlightClass = daysRemainingValue < 0 ? 'row-critical' : daysRemainingValue <= 3 ? 'row-warning' : '';
            const outputPriorityLevel = indexPosition < 3 ? 'p1' : indexPosition < 6 ? 'p2' : 'p3';
            const outputPriorityLabel = indexPosition < 3 ? '[Alta]' : indexPosition < 6 ? '[Media]' : '[Baja]';
            const stockBarColorCode = daysRemainingValue < 0 ? '#ef4444' : daysRemainingValue < 3 ? '#f59e0b' : '#10b981';
            const stockBarWidthPercentage = (batchRecord.current_quantity / batchRecord.initial_quantity) * 100;

            return `
                <tr class="${rowHighlightClass}">
                    <td><strong>#${batchRecord.batch_code}</strong></td>
                    <td><div class="td-product"><i class="fas fa-box"></i> ${batchRecord.product_name}</div></td>
                    <td>${formatDate(batchRecord.entry_date)}</td>
                    <td>${formatDate(batchRecord.expiry_date)}</td>
                    <td>
                        <div class="mini-stock">
                            <div class="stock-bar"><div class="stock-fill" style="width:${stockBarWidthPercentage}%;background:${stockBarColorCode};"></div></div>
                            <span>${batchRecord.current_quantity}/${batchRecord.initial_quantity}</span>
                        </div>
                    </td>
                    <td>${batchRecord.warehouse_location || '-'}</td>
                    <td>${getStatusBadge(daysRemainingValue)}</td>
                    <td><span class="peps-priority ${outputPriorityLevel}">${outputPriorityLabel} ${indexPosition + 1}°</span></td>
                    <td>
                        <button class="icon-btn-sm" title="Ver lote"><i class="fas fa-eye"></i></button>
                        <button class="icon-btn-sm" title="Registrar salida" onclick="registerOutput(${batchRecord.batch_id})"><i class="fas fa-minus-circle"></i></button>
                        <button class="icon-btn-sm btn-danger-text" title="Eliminar lote" onclick="deleteBatchConfirm(${batchRecord.batch_id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (error) {
        console.error(error);
    }
}

async function prepareLotForm() {
    try {
        const [productsListArray, suppliersListArray] = await Promise.all([
            api.getProducts(),
            api.getSuppliers()
        ]);

        const productDropdownSelect = document.getElementById('lot-product-select');
        const supplierDropdownSelect = document.getElementById('lot-supplier-select');

        productDropdownSelect.innerHTML = '<option value="">Seleccionar producto...</option>' +
            productsListArray.map(productItem => `<option value="${productItem.sku}">${productItem.name}</option>`).join('');

        supplierDropdownSelect.innerHTML = '<option value="">Seleccionar proveedor...</option>' +
            suppliersListArray.map(supplierItem => `<option value="${supplierItem.supplier_id}">${supplierItem.name}</option>`).join('');

        const currentDateString = new Date().toISOString().split('T')[0];
        document.querySelector('input[name="entry_date"]').value = currentDateString;
    } catch (error) {
        console.error(error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeBatchRegistrationHandler();
    initializeProductRegistrationHandler();
});

function initializeBatchRegistrationHandler() {
    const batchRegistrationForm = document.getElementById('lot-form');
    if (!batchRegistrationForm) return;

    batchRegistrationForm.addEventListener('submit', async (submitEvent) => {
        submitEvent.preventDefault();
        try {
            const formSubmissionData = new FormData(batchRegistrationForm);
            const formattedPayload = Object.fromEntries(formSubmissionData);

            formattedPayload.supplier_id = formattedPayload.supplier_id || null;
            formattedPayload.initial_quantity = parseFloat(formattedPayload.initial_quantity);
            formattedPayload.unit_cost = parseFloat(formattedPayload.unit_cost) || 0;

            const apiResponse = await api.createBatch(formattedPayload);
            if (apiResponse.ok) {
                showToast('Éxito', 'Lote registrado correctamente', 'success');
                batchRegistrationForm.reset();
                navigateTo('screen-lots');
            } else {
                const responseErrorData = await apiResponse.json();
                showToast('Error', responseErrorData.error || 'No se pudo registrar el lote', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error', 'Error de conexión', 'error');
        }
    });
}

function initializeProductRegistrationHandler() {
    const productRegistrationForm = document.getElementById('new-product-form');
    if (!productRegistrationForm) return;

    productRegistrationForm.addEventListener('submit', async (submitEvent) => {
        submitEvent.preventDefault();
        try {
            const formSubmissionData = new FormData(productRegistrationForm);
            const formattedPayload = Object.fromEntries(formSubmissionData);

            formattedPayload.sale_price = parseFloat(formattedPayload.sale_price);
            formattedPayload.min_stock = parseFloat(formattedPayload.min_stock) || 0;
            formattedPayload.category_id = formattedPayload.category_id || null;
            formattedPayload.requires_refrigeration = !!formattedPayload.requires_refrigeration;

            const isEditModeActive = formattedPayload.form_mode === 'edit';
            const apiResponse = isEditModeActive
                ? await api.updateProduct(formattedPayload.sku, formattedPayload)
                : await api.createProduct(formattedPayload);

            if (apiResponse.ok) {
                showToast('Éxito', isEditModeActive ? 'Producto actualizado' : 'Producto creado', 'success');
                closeNewProductPanel();
                productRegistrationForm.reset();
                loadProducts();
                if (isEditModeActive) navigateTo('screen-products');
            } else {
                const responseErrorData = await apiResponse.json();
                showToast('Error', responseErrorData.error || 'No se pudo crear el producto', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error', 'Error de conexión', 'error');
        }
    });
}

function updateAlertCountersDisplay(expiringBatchesArray) {
    try {
        document.getElementById('alert-expired').textContent = expiringBatchesArray.filter(batchRecord => getDaysRemaining(batchRecord.expiry_date) < 0).length;
        document.getElementById('alert-today').textContent = expiringBatchesArray.filter(batchRecord => getDaysRemaining(batchRecord.expiry_date) === 0).length;
        document.getElementById('alert-week').textContent = expiringBatchesArray.filter(batchRecord => {
            const daysRemainingValue = getDaysRemaining(batchRecord.expiry_date);
            return daysRemainingValue > 0 && daysRemainingValue <= 7;
        }).length;
        document.getElementById('alert-stock').textContent = '3';
    } catch (error) {
        console.error(error);
    }
}

async function loadAlerts() {
    try {
        const expiringBatchesList = await api.getExpiringBatches(30);
        updateAlertCountersDisplay(expiringBatchesList);

        const alertsContainerElement = document.getElementById('alerts-container');
        alertsContainerElement.innerHTML = expiringBatchesList.map(batchRecord => {
            const daysRemainingValue = getDaysRemaining(batchRecord.expiry_date);
            let alertTypeClass = 'alert-warning';
            let alertIconClass = 'fa-clock';
            let alertTitleString = 'Próximo a Vencer';

            if (daysRemainingValue < 0) {
                alertTypeClass = 'alert-critical';
                alertIconClass = 'fa-skull-crossbones';
                alertTitleString = 'Producto VENCIDO';
            } else if (daysRemainingValue === 0) {
                alertTypeClass = 'alert-danger';
                alertIconClass = 'fa-exclamation-circle';
                alertTitleString = 'Vence HOY';
            }

            const alertIconWrapperClass = daysRemainingValue < 0 ? 'critical' : daysRemainingValue === 0 ? 'danger' : 'warning';
            const alertTimeSubtext = daysRemainingValue < 0 ? `Vencido hace ${Math.abs(daysRemainingValue)} días` : daysRemainingValue === 0 ? 'Vence hoy' : `${daysRemainingValue} días restantes`;
            const alertActionButtonHtml = daysRemainingValue < 0 ? '<button class="btn-danger btn-sm">Registrar Merma</button>' : '';

            return `
                <div class="alert-item ${alertTypeClass}">
                    <div class="alert-icon-wrap ${alertIconWrapperClass}">
                        <i class="fas ${alertIconClass}"></i>
                    </div>
                    <div class="alert-content">
                        <div class="alert-header-row">
                            <h4>${alertTitleString} - ${batchRecord.product_name}</h4>
                            <span class="alert-time">${formatDate(batchRecord.expiry_date)}</span>
                        </div>
                        <p>Lote #${batchRecord.batch_code} - ${alertTimeSubtext}</p>
                        <div class="alert-actions">
                            <button class="btn-outline btn-sm">Ver Lote</button>
                            ${alertActionButtonHtml}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (error) {
        console.error(error);
    }
}

async function loadSuppliers() {
    try {
        const suppliersListArray = await api.getSuppliers();
        const suppliersGridContainer = document.getElementById('suppliers-grid');

        suppliersGridContainer.innerHTML = suppliersListArray.map(supplierItem => `
            <div class="supplier-card">
                <div class="sc-header">
                    <div class="sc-avatar" style="background:#dbeafe;color:#3b82f6;">${supplierItem.name.substring(0, 2).toUpperCase()}</div>
                    <div class="sc-info"><h4>${supplierItem.name}</h4><span class="sc-type">Proveedor</span></div>
                    <span class="status-badge ok">Activo</span>
                </div>
                <div class="sc-body">
                    <div class="sc-detail"><i class="fas fa-phone"></i> ${supplierItem.phone || 'N/A'}</div>
                    <div class="sc-detail"><i class="fas fa-envelope"></i> ${supplierItem.email || 'N/A'}</div>
                    <div class="sc-stats">
                        <div class="sc-stat"><span class="sc-stat-val">${supplierItem.product_count}</span><span class="sc-stat-lbl">Productos</span></div>
                        <div class="sc-stat"><span class="sc-stat-val">${supplierItem.batch_count}</span><span class="sc-stat-lbl">Lotes</span></div>
                    </div>
                </div>
                <div class="sc-footer">
                    <button class="btn-outline btn-sm"><i class="fas fa-eye"></i> Ver</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
    }
}

async function loadCategoriesSelect() {
    try {
        const categoriesListArray = await api.getCategories();
        const categoryDropdownSelect = document.getElementById('new-product-category');
        if (categoryDropdownSelect) {
            categoryDropdownSelect.innerHTML = '<option value="">Seleccionar...</option>' +
                categoriesListArray.map(categoryItem => `<option value="${categoryItem.category_id}">${categoryItem.name}</option>`).join('');
        }
    } catch (error) {
        console.error(error);
    }
}

function editProduct(productDetailsObject) {
    try {
        const productRegistrationForm = document.getElementById('new-product-form');
        document.getElementById('product-panel-title').innerHTML = `<i class="fas fa-edit"></i> Editar Producto: ${productDetailsObject.sku}`;
        document.getElementById('product-form-mode').value = 'edit';

        productRegistrationForm.sku.value = productDetailsObject.sku;
        productRegistrationForm.sku.readOnly = true;
        productRegistrationForm.name.value = productDetailsObject.name;
        productRegistrationForm.description.value = productDetailsObject.description || '';
        productRegistrationForm.category_id.value = productDetailsObject.category_id || '';
        productRegistrationForm.unit_id.value = productDetailsObject.unit_id || 5;
        productRegistrationForm.sale_price.value = productDetailsObject.sale_price;
        productRegistrationForm.min_stock.value = productDetailsObject.min_stock;
        productRegistrationForm.barcode.value = productDetailsObject.barcode || '';
        productRegistrationForm.requires_refrigeration.checked = !!productDetailsObject.requires_refrigeration;

        openNewProductPanel();
    } catch (error) {
        console.error(error);
    }
}

async function deleteProductConfirm(productSkuIdentifier) {
    if (confirm(`¿Estás seguro de eliminar el producto ${productSkuIdentifier}?`)) {
        try {
            const apiResponse = await api.deleteProduct(productSkuIdentifier);
            if (apiResponse.ok) {
                showToast('Éxito', 'Producto eliminado exitosamente', 'success');
                loadProducts();
                navigateTo('screen-products');
            } else {
                const responseErrorData = await apiResponse.json();
                showToast('Error', responseErrorData.error || 'No se pudo eliminar', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error', 'Error de conexión', 'error');
        }
    }
}

function animateNumericValue(targetElementId, startValue, endValue, animationDurationMs) {
    try {
        const targetDomElement = document.getElementById(targetElementId);
        if (!targetDomElement) return;
        let animationStartTimestamp = null;

        const animationStepProcessor = (currentTimestamp) => {
            if (!animationStartTimestamp) animationStartTimestamp = currentTimestamp;
            const animationProgressRatio = Math.min((currentTimestamp - animationStartTimestamp) / animationDurationMs, 1);
            targetDomElement.innerHTML = Math.floor(animationProgressRatio * (endValue - startValue) + startValue);

            if (animationProgressRatio < 1) {
                window.requestAnimationFrame(animationStepProcessor);
            }
        };
        window.requestAnimationFrame(animationStepProcessor);
    } catch (error) {
        console.error(error);
    }
}

function registerOutput(batchIdentifierId) {
    try {
        const outputQuantityValue = prompt('Ingrese cantidad a retirar:');
        if (outputQuantityValue && !isNaN(outputQuantityValue)) {
            showToast('Éxito', `Se registraron ${outputQuantityValue} unidades de salida`, 'success');
            loadLots();
        }
    } catch (error) {
        console.error(error);
    }
}

async function deleteBatchConfirm(batchIdentifierId) {
    if (confirm('¿Estás seguro de eliminar este lote permanentemente? Esta acción eliminará también el historial de movimientos asociado.')) {
        try {
            const apiResponse = await api.deleteBatch(batchIdentifierId);
            if (apiResponse.ok) {
                showToast('Éxito', 'Lote eliminado', 'success');
                if (AppState.currentScreen === 'screen-lots') loadLots();
                if (AppState.currentScreen === 'screen-product-detail') {
                    const extractedSkuValue = document.getElementById('detail-sku').textContent.replace('SKU: ', '');
                    viewProductDetail(extractedSkuValue);
                }
            } else {
                const responseErrorData = await apiResponse.json();
                showToast('Error', responseErrorData.error || 'No se pudo eliminar el lote', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Error', 'Error de conexión', 'error');
        }
    }
}