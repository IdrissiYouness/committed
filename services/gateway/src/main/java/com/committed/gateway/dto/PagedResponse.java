package com.committed.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Generic paginated response wrapper.
 * Used by admin list endpoints to return a page of items alongside pagination metadata.
 *
 * <pre>
 * {
 *   "content":       [...],
 *   "page":          0,
 *   "size":          20,
 *   "totalElements": 47,
 *   "totalPages":    3,
 *   "hasNext":       true,
 *   "hasPrev":       false
 * }
 * </pre>
 *
 * @param <T> the type of element in the content list
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> {

    /** The items on the current page. */
    private List<T> content;

    /** 0-based current page index. */
    private int page;

    /** Number of items requested per page. */
    private int size;

    /** Total number of elements across all pages. */
    private long totalElements;

    /** Total number of pages given the current page size. */
    private int totalPages;

    /** Whether there is a next page after this one. */
    private boolean hasNext;

    /** Whether there is a previous page before this one. */
    private boolean hasPrev;
}