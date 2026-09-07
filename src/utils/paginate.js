const paginate = async (modelDelegate, filter = {}, options = {}) => {
  const page = Math.max(options.page, 1);
  const limit = Math.max(options.limit, 1);
  const skip = (page - 1) * limit;

  let orderBy = { createdAt: 'desc' };
  if (options.sortBy) {
    const [sortKey, sortOrder] = options.sortBy.split(':');
    orderBy = { [sortKey]: sortOrder === 'desc' ? 'desc' : 'asc' };
  }

  const [results, totalResults] = await Promise.all([
    modelDelegate.findMany({
      where: filter,
      orderBy,
      skip,
      take: limit,
      ...(options.include && { include: options.include }),
      ...(options.select && { select: options.select }),
    }),
    modelDelegate.count({ where: filter }),
  ]);

  const totalPages = Math.ceil(totalResults / limit);

  return {
    results,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

export { paginate };
