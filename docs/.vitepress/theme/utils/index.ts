export const getStoragePage = () => {
    const path = window.location.pathname + window.location.search;
    const currentPage = JSON.parse(
        sessionStorage.getItem('currentPage') || 'null',
    );

    if (currentPage === null || path !== currentPage.path) {
        sessionStorage.setItem(
            'currentPage',
            JSON.stringify({ page: 1, path: '' }),
        );
        return 1;
    }

    return parseInt(currentPage.page);
};

export const setStoragePage = (page: number) => {
    const path = window.location.pathname + window.location.search;
    sessionStorage.setItem('currentPage', JSON.stringify({ page, path }));
};

export const getOneColor = () => {
    const tagColorArr = [
        '#e15b64',
        '#f47e60',
        '#f8b26a',
        '#abbd81',
        '#849b87',
        '#e15b64',
        '#f47e60',
        '#f8b26a',
        '#f26d6d',
        '#67cc86',
        '#fb9b5f',
        '#3498db',
    ];
    const index = Math.floor(Math.random() * tagColorArr.length);
    return tagColorArr[index];
};
