<template>
  <div class="article">
    <div class="article-header">
      <div class="article-header-title" id="article-title">
        <span>{{ title }}</span>
      </div>
      <div class="article-header-meta" v-if="showMeta">
        <div class="article-header-meta__item" v-if="showDate">
          <Date /><span>{{ meta.date }}</span>
        </div>
      </div>
    </div>
    <div
      :class="{
        'article-content': true,
        'text-justify': $theme.article.useJustifyAlign,
      }"
      id="article-content"
      v-lazy-container="{ selector: 'img' }"
      v-html="renderedContent"
      v-if="showContent"
    ></div>
    <div class="article-content article-content-loading" v-if="contentLoading">
      <span>
        {{ $t('article_loading') }}
      </span>
      <i><Loading /></i>
    </div>
    <div class="article-content article-content-failed" v-if="loadFailed">
      <p>{{ $t('article_load_failed') }}</p>
    </div>
    <div class="article-comment" v-if="showValine">
      <div id="vcomments"></div>
    </div>
  </div>
</template>

<script>
import pangu from 'pangu.simple';
import Date from '../icons/Date';
import Loading from '../icons/Loading';
import { optimizeExternalLink } from '../../utils/renderer';
import { mapGetters, mapMutations, mapState } from 'vuex';

export default {
  name: 'fragy.purity.article',
  props: {
    article: String,
  },
  components: {
    Date,
    Loading,
  },
  data() {
    return {
      meta: null,
      content: '',
      contentLoading: true,
      renderedContent: '',
      loadFailed: false,
      showValine: this.$theme.valine.enable,
      valine: null,
    };
  },
  watch: {
    async filename(newValue) {
      if (!newValue) {
        return;
      }
      this.meta = null;
      this.content = '';
      this.contentLoading = true;
      this.loadFailed = false;
      this.renderedContent = '';
      await this.fetchArticle();
      this.setTitle();
      window.scrollTo({
        top: 0,
      });
    },
  },
  async mounted() {
    await this.fetchArticle();
    this.setTitle();
    // scroll to top
    window.scrollTo({
      top: 0,
    });
    // mount valine
    if (this.showValine) {
      const valineConfig = Object.assign({}, this.$theme.valine);
      delete valineConfig.enable;
      const valine = new window.Valine({
        el: '#vcomments',
        ...valineConfig,
      });
      this.valine = valine;
    }
  },
  computed: {
    ...mapState({
      storedTitle: (state) => state.article.title,
    }),
    ...mapGetters('article', ['getCachedContent', 'cacheExisted']),
    title() {
      let title;
      if (this.storedTitle) {
        title = this.storedTitle;
      } else if (this.meta?.title) {
        title = this.meta.title;
      } else {
        title = this.$route.params.name;
        if (title.endsWith('.md')) {
          title = title.substr(0, title.length - 3);
        }
      }
      return pangu.spacing(title);
    },
    filename() {
      if (!this.$route.path.includes('article')) {
        return '';
      }
      let filename = this.$route.params.name;
      if (!filename.endsWith('.md')) {
        filename = `${filename}.md`;
      }
      return filename;
    },
    showMeta() {
      return !!this.meta;
    },
    showDate() {
      return !!this.meta?.date;
    },
    showContent() {
      return !this.contentLoading && !this.loadFailed;
    },
  },
  methods: {
    ...mapMutations('article', ['setCache']),
    async fetchArticle() {
      if (this.cacheExisted(this.filename)) {
        this.afterLoaded(this.getCachedContent(this.filename));
        return;
      }
      let res;
      try {
        res = await this.$http.get(`${this.$fragy.articles.feed}/${this.filename}`);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch article content.', err);
        this.contentLoading = false;
        this.loadFailed = true;
        return;
      }
      const parsedArticle = this.$utils.parseArticle(res.data.trim());
      this.setCache({
        filename: this.filename,
        article: parsedArticle,
      });
      this.afterLoaded(parsedArticle);
    },
    afterLoaded(parsedArticle) {
      this.meta = parsedArticle.meta;
      this.content = parsedArticle.content.trim();
      this.contentLoading = false;
      this.renderContent();
    },
    renderContent() {
      this.renderedContent = window.marked(this.content);
      this.$nextTick(() => {
        pangu.spacingElementById('article-title');
        pangu.spacingElementById('article-content');
        optimizeExternalLink(document.querySelector('#article-content'));
      });
    },
    setTitle() {
      const template = this.$theme.article.title;
      document.title = template
        .replace('{articleTitle}', this.title)
        .replace('{siteTitle}', this.$fragy.title);
    },
  },
};
</script>

<style lang="less">
.article {
  &-header {
    border-bottom: 0.0625rem dashed var(--article-border);
    padding-bottom: 1.5rem;
    &-title {
      font-size: 1.5rem;
      font-weight: 600;
      text-align: justify;
      color: var(--article-title);
    }
    &-meta {
      margin-top: 1rem;
      &__item {
        display: flex;
        align-items: center;
        svg {
          width: 1.125rem;
          height: 1.125rem;
          margin-right: 0.5rem;
          fill: var(--article-meta);
        }
        span {
          color: var(--article-meta);
          font-size: 0.875rem;
        }
      }
    }
  }
  &-content {
    padding: 1.5rem 0;
    border-bottom: 0.0625rem dashed var(--article-border);
    line-height: 2;
    color: var(--article-text);
    p {
      color: var(--article-text);
      margin: 0;
      line-height: 36px;
      code {
        padding: 4px 6px;
        background: var(--article-code-bg);
        font-size: 0.875rem;
      }
    }
    a {
      color: var(--article-text);
    }
    a:hover {
      color: var(--article-link-hover) !important;
    }
    a:visited {
      color: var(--article-text);
    }
    h1,
    h2,
    h3,
    h4,
    h5 {
      color: var(--article-title);
      border-bottom: 0.0625rem solid var(--article-title-border);
    }
    h1:first-child,
    h2:first-child,
    h3:first-child,
    h4:first-child,
    h5:first-child {
      margin-top: 0;
    }
    h1 {
      font-size: 1.375rem;
    }
    h2 {
      font-size: 1.25rem;
    }
    h3 {
      font-size: 1.15rem;
    }
    h4 {
      font-size: 1.115rem;
    }
    h5 {
      font-size: 1.025rem;
    }
    img {
      display: block;
      max-width: 100%;
      margin: 1rem auto;
    }
    pre {
      width: 100%;
      background: var(--article-code-bg);
      padding: 0.75rem 1rem;
      box-sizing: border-box;
      overflow-x: auto;
      code {
        color: var(--article-code-text);
      }
    }
    ul {
      color: var(--article-text);
    }
  }
  &-content-loading {
    display: flex;
    align-items: center;
    span {
      color: var(--article-text);
    }
    i {
      display: flex;
      align-items: center;
      svg {
        width: 1.25rem;
        height: 1.25rem;
        fill: var(--primary);
        transform: translateY(-0.125rem);
        margin-left: 0.625rem;
        animation: rotate 1.125s ease-in-out infinite;
      }
    }
  }
  &-comment {
    padding-top: 2.5rem;
  }
}

.dark {
  .article {
    img {
      filter: brightness(0.875);
    }
  }
}
</style>
