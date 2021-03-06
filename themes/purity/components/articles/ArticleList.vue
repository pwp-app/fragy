<template>
  <div class="article-list article-list-empty" v-if="showEmpty">
    <span v-if="listDataLoading">{{ $t('article_list_loading') }}</span>
    <span v-if="loadFailed">{{ $t('article_list_load_failed') }}</span>
    <span v-if="showDefaultEmptyText">{{ $t('aritcle_list_empty') }}</span>
  </div>
  <div class="article-list" v-else>
    <div class="article-list__main">
      <ArticleBlock
        v-for="item in currentArticles"
        :key="item.title"
        :title="item.title"
        :abstract="item.abstract"
        :date="item.date"
        :filename="item.filename"
      />
    </div>
    <div class="article-list__footer">
      <Paginator
        :currentPage="currentPage"
        :pageCount="pageCount"
        @change="onPageChange"
        v-if="pageCount > 1"
      />
    </div>
  </div>
</template>

<script>
import ArticleBlock from './ArticleBlock';
import Paginator from '../layout/Paginator';
import { mapGetters, mapMutations } from 'vuex';

export default {
  name: 'fragy.purity.articles.list',
  components: {
    ArticleBlock,
    Paginator,
  },
  data() {
    const currentPage = parseInt(this.$route.query?.page, 10) || 1;
    return {
      currentPage,
      total: 0,
      pageSize: this.$fragy.articleList.pageSize,
      articles: null,
      listDataLoading: true,
      loadFailed: false,
      lastFetchTime: null,
      loadedPages: {},
    };
  },
  created() {
    this.fetchArticlesList();
  },
  computed: {
    ...mapGetters('article', ['cacheExisted']),
    showEmpty() {
      return this.listDataLoading || this.loadFailed || this.showDefaultEmptyText;
    },
    showDefaultEmptyText() {
      return !this.listDataLoading && !this.loadFailed && !this.currentArticles;
    },
    currentArticles() {
      if (!this.articles) {
        return null;
      }
      if (this.$fragy.articleList.splitPage) {
        return this.articles[this.currentPage];
      } else {
        const start = (this.currentPage - 1) * 10;
        const end = this.currentPage * 10;
        return this.articles.slice(start, end);
      }
    },
    pageCount() {
      if (this.$fragy.articleList.splitPage) {
        return Math.floor(this.total / this.pageSize) + 1;
      } else {
        return Math.floor(this.articles.length / this.pageSize) + 1;
      }
    },
  },
  methods: {
    ...mapMutations('article', ['setCache']),
    getFeed(page) {
      return this.$fragy.articleList.splitPage
        ? `${this.$fragy.articleList.feed}/page-${page}.json`
        : this.$fragy.articleList.feed;
    },
    async fetchArticlesList() {
      if (this.loadedPages[this.currentPage]) {
        this.$nextTick(() => {
          if (this.$theme.article.prefetch) {
            this.prefetchAricles();
          }
          if (this.$fragy.articleList.splitPage && this.$theme.articleList.prefetch) {
            this.prefetchArticleList();
          }
        });
        return;
      }
      // reset flags
      this.listDataLoading = true;
      this.loadFailed = false;
      // send request
      let res;
      try {
        res = await this.$http.get(this.getFeed(this.currentPage));
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch article list info.', err);
        this.listDataLoading = false;
        this.loadFailed = true;
        return;
      }
      this.listDataLoading = false;
      if (res.data.total) {
        this.total = res.data.total;
      }
      this.loadedPages[this.currentPage] = true;
      if (this.$fragy.articleList.splitPage) {
        if (!this.articles) this.articles = {};
        this.$set(this.articles, this.currentPage, res.data.listData);
      } else {
        this.articles = res.data.listData;
      }
      this.lastFetchTime = Date.now();
      if (this.$theme.article.prefetch) {
        this.$nextTick(() => {
          this.prefetchAricles();
        });
      }
      if (this.$fragy.articleList.splitPage && this.$theme.articleList.prefetch) {
        this.$nextTick(() => {
          this.prefetchArticleList();
        });
      }
    },
    async prefetchArticleList() {
      if (this.currentPage === this.pageCount) {
        return;
      }
      const needFetch = [];
      if (this.currentPage === 1) {
        needFetch.push(2);
      } else {
        needFetch.push(this.currentPage - 1);
        needFetch.push(this.currentPage + 1);
      }
      needFetch.forEach(async (page) => {
        // check existed cache
        if (this.loadedPages[page]) {
          return;
        }
        // fetch info
        let res;
        try {
          res = await this.$http.get(this.getFeed(page));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed to pre-fetch article list info.', err);
          return;
        }
        this.$set(this.articles, page, res.data.listData);
        this.loadedPages[page] = true;
      });
    },
    onPageChange(page) {
      this.currentPage = page;
      if (this.$route.query?.page !== page) {
        if (page !== 1) {
          this.$router.replace({
            query: {
              page,
            },
          });
        } else {
          this.$router.replace({
            query: null,
          });
        }
      }
      if (this.$fragy.articleList.splitPage) {
        this.fetchArticlesList();
      } else if (this.$theme.article.prefetch) {
        this.$nextTick(() => {
          this.prefetchAricles();
        });
      }
    },
    prefetchAricles() {
      if (!this.currentArticles) {
        return;
      }
      this.currentArticles.forEach(async (article) => {
        if (this.cacheExisted(article.filename)) {
          return;
        }
        const res = await this.$http.get(`${this.$fragy.articles.feed}/${article.filename}`);
        const parsedArticle = this.$utils.parseArticle(res.data.trim());
        this.setCache({
          filename: article.filename,
          article: parsedArticle,
        });
      });
    },
  },
};
</script>

<style lang="less">
.article-list-empty {
  user-select: none;
  span {
    color: var(--article-block-text);
  }
}
</style>
