const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_OFFSET = 1000000;

// Parses ?limit & ?offset. Returns { error } for invalid values.
function parsePagination(query) {
  let limit = DEFAULT_LIMIT;
  let offset = 0;
  if (query.limit !== undefined) {
    limit = Number(query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return { error: `limit must be an integer between 1 and ${MAX_LIMIT}` };
    }
  }
  if (query.offset !== undefined) {
    offset = Number(query.offset);
    if (!Number.isInteger(offset) || offset < 0 || offset > MAX_OFFSET) {
      return { error: `offset must be an integer between 0 and ${MAX_OFFSET}` };
    }
  }
  return { limit, offset };
}

// Models fetch limit + 1 rows; this trims the extra row and reports hasMore.
function paginate(rows, limit, offset) {
  const hasMore = rows.length > limit;
  return { data: hasMore ? rows.slice(0, limit) : rows, meta: { limit, offset, hasMore } };
}

module.exports = { parsePagination, paginate };
