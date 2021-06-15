export const formatConfig = (userConfig) => {
  const config = Object.assign(
    {
      articles: {
        base: '/posts',
      },
      articleList: {
        infoPath: '/data/articleList.json',
      },
    },
    userConfig,
  );
  // format articles
  if (config.articles.base) {
    let { base } = config.articles;
    if (!base.startsWith('/')) {
      base = `/${base}`;
    }
    if (base.endsWith('/')) {
      base = base.substr(0, base.length - 1);
    }
    config.articles.base = base;
  }
  return config;
};
