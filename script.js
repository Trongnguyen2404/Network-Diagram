const PDF_FILE = 'my_document.pdf';
const NUM_ROWS = 4;

const CROP_MARGINS = {
    top: 36.3,
    bottom: 58.2,
    left: 36.5,
    right: 36.5
};

const RENDER_SCALE = 2;

const pdfGrid = document.getElementById('pdf-grid');
const viewerContainer = document.getElementById('viewer-container');
const loadingIndicator = document.getElementById('loading-indicator');

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;

async function renderPdf() {
    try {
        loadingIndicator.style.display = 'flex';
        const pdf = await pdfjsLib.getDocument(PDF_FILE).promise;
        const numPages = pdf.numPages;
        const renderPromises = [];

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const canvas = document.createElement('canvas');
            canvas.className = 'page-canvas';
            pdfGrid.appendChild(canvas);

            const renderPromise = pdf.getPage(pageNum).then(page => {

                const viewport = page.getViewport({
                    scale: RENDER_SCALE,
                    rotation: page.rotate
                });

                const scaledLeft = CROP_MARGINS.left * RENDER_SCALE;
                const scaledTop = CROP_MARGINS.top * RENDER_SCALE;
                const scaledRight = CROP_MARGINS.right * RENDER_SCALE;
                const scaledBottom = CROP_MARGINS.bottom * RENDER_SCALE;

                const finalWidth = viewport.width - scaledLeft - scaledRight;
                const finalHeight = viewport.height - scaledTop - scaledBottom;

                if (finalWidth <= 0 || finalHeight <= 0) {
                    console.error(`Lề cắt tại trang ${pageNum} quá lớn.`);
                    return;
                }
                
                const context = canvas.getContext('2d');
                canvas.width = finalWidth;
                canvas.height = finalHeight;

                canvas.style.width = `${finalWidth / RENDER_SCALE}px`;
                canvas.style.height = `${finalHeight / RENDER_SCALE}px`;

                context.translate(-scaledLeft, -scaledTop);
                
                return page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
            });
            renderPromises.push(renderPromise);
        }

        await Promise.all(renderPromises);
        console.log('Render hoàn tất bằng phương pháp Dịch chuyển Canvas.');

        const firstCanvas = pdfGrid.querySelector('canvas');
        if (firstCanvas) {
            const pageW = parseFloat(firstCanvas.style.width);
            const numCols = Math.ceil(numPages / NUM_ROWS);
            const totalGridWidth = numCols * pageW;
            pdfGrid.style.width = totalGridWidth + 'px';
        }

        const panzoom = Panzoom(pdfGrid, {
            maxScale: 10,
            minScale: 0.1,
            contain: 'outside'
        });

        viewerContainer.addEventListener('wheel', panzoom.zoomWithWheel);
        loadingIndicator.style.display = 'none';

    } catch (error) {
        console.error('Lỗi khi tải hoặc render PDF:', error);
        loadingIndicator.innerHTML = `<p style="color: red;">Đã xảy ra lỗi: ${error.message}.</p>`;
    }
}

renderPdf();