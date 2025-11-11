/**
 * Represents a generic paginated response.
 */
class PaginatedResult<T> {
    page_num: number;
    page_size: number;
    total_pages: number;
    total_items: number;
    items: T[];

    constructor(page_num: number, page_size: number, total_items: number, items: T[]) {
        this.page_num = page_num;
        this.page_size = page_size;
        this.total_items = total_items;
        this.total_pages = Math.ceil(total_items / page_size);
        this.items = items;
    }
}


export { PaginatedResult }